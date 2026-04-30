import { useState, useEffect, useCallback } from 'react';
import { ActivityLog, ActivityLogUI } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useActivityFeed(projectId: string | null) {
  const { token } = useAuth();
  const [activities, setActivities] = useState<ActivityLogUI[]>([]);
  const [loading, setLoading] = useState(false);

  const mapActivity = useCallback((activity: ActivityLog & { profile?: ActivityLogUI['profile'] }) => ({
    id: activity.id,
    projectId: activity.project_id,
    userId: activity.user_id,
    action: activity.action,
    entityType: activity.entity_type,
    entityId: activity.entity_id ?? undefined,
    entityName: activity.entity_name ?? undefined,
    details: activity.details ?? undefined,
    createdAt: new Date(activity.created_at),
    profile: activity.profile,
  }), []);

  const fetchActivities = useCallback(async () => {
    if (!projectId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch activity feed');
      setActivities((data.activities as Array<ActivityLog & { profile?: ActivityLogUI['profile'] }>).map(mapActivity));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch activity feed.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [projectId, token, mapActivity]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (!projectId || !token) return;

    const eventSource = new EventSource(`/api/projects/${projectId}/activity/stream?token=${encodeURIComponent(token)}`);
    eventSource.addEventListener('activity_created', () => {
      void fetchActivities();
    });
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, token, fetchActivities]);

  return {
    activities,
    loading,
    fetchActivities,
  };
}
