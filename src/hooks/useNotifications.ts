import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const hasLoadedNotifications = useRef(false);
  const seenNotificationIds = useRef<Set<string>>(new Set());

  const showBrowserNotification = useCallback(async (notification: Notification) => {
    if (!pushEnabled || Notification.permission !== 'granted') return;

    const url = notification.task_id
      ? `/?task=${notification.task_id}`
      : notification.project_id
        ? `/?project=${notification.project_id}`
        : '/';

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, {
        body: notification.message || undefined,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notification-${notification.id}`,
        data: {
          url,
          taskId: notification.task_id,
          projectId: notification.project_id,
        },
      });
      return;
    }

    new Notification(notification.title, {
      body: notification.message || undefined,
      icon: '/favicon.ico',
      tag: `notification-${notification.id}`,
    });
  }, [pushEnabled]);

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load notifications');
      const fetchedNotifications = data.notifications as Notification[];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter((n) => !n.read).length);

      if (!hasLoadedNotifications.current) {
        seenNotificationIds.current = new Set(fetchedNotifications.map((n) => n.id));
        hasLoadedNotifications.current = true;
        return;
      }

      for (const notification of fetchedNotifications) {
        if (!seenNotificationIds.current.has(notification.id)) {
          seenNotificationIds.current.add(notification.id);
          if (!notification.read) {
            void showBrowserNotification(notification);
          }
        }
      }
    } catch (error) {
      // Optionally show error toast
    }
  }, [user, token, showBrowserNotification]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user || !token) return;

    const eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
    eventSource.addEventListener('notification_created', () => {
      void fetchNotifications();
    });
    eventSource.addEventListener('notifications_read', () => {
      void fetchNotifications();
    });
    eventSource.onerror = () => {
      eventSource.close();
    };

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchNotifications();
      }
    };

    const handleWindowFocus = () => {
      void fetchNotifications();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      eventSource.close();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, token, fetchNotifications]);

  useEffect(() => {
    setPushEnabled(localStorage.getItem('push-notifications-enabled') === 'true');
  }, []);

  useEffect(() => {
    if (!user) {
      hasLoadedNotifications.current = false;
      seenNotificationIds.current = new Set();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user || !token) return;
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      // Optionally show error toast
    }
  }, [user, token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      // Optionally show error toast
    }
  }, [user, token]);

  // Request browser push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not supported',
        description: 'This browser does not support notifications.',
        variant: 'destructive',
      });
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('push-notifications-enabled', 'true');
        setPushEnabled(true);
        toast({ title: 'Push notifications enabled' });
        return true;
      } else {
        toast({
          title: 'Permission denied',
          description: 'Push notifications were not allowed.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable push notifications.',
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  const disablePushNotifications = useCallback(async () => {
    localStorage.setItem('push-notifications-enabled', 'false');
    setPushEnabled(false);
  }, []);

  // Create a notification (optional, for admin or system use)
  const createNotification = useCallback(
    async (
      type: string,
      title: string,
      message?: string,
      taskId?: string,
      projectId?: string
    ) => {
      if (!user || !token) return;
      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type, title, message, taskId, projectId }),
        });
        if (!res.ok) throw new Error('Failed to create notification');
        await fetchNotifications();
      } catch (error) {
        // Optionally show error toast
      }
    },
    [user, token, fetchNotifications]
  );

  return {
    notifications,
    unreadCount,
    pushEnabled,
    markAsRead,
    markAllAsRead,
    requestPushPermission,
    disablePushNotifications,
    createNotification,
  };
}
