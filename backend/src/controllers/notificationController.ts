import { Request, Response } from 'express';
import { getNotificationsByUser, createNotification, markNotificationRead, markAllNotificationsRead } from '../models/notification';
import { addNotificationClient, emitNotificationEvent, removeNotificationClient } from '../utils/notificationEvents';

export async function getNotifications(req: any, res: Response) {
  const userId = req.user.id;
  const notifications = await getNotificationsByUser(userId);
  res.json({ notifications });
}

export async function streamNotifications(req: any, res: Response) {
  const userId = Number(req.user.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('event: connected\ndata: {"ok":true}\n\n');

  const client = addNotificationClient(userId, res);
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeNotificationClient(userId, client);
  });
}

export async function addNotification(req: any, res: Response) {
  const userId = req.user.id;
  const { type, title, message, task_id, project_id, taskId, projectId } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'Missing required fields' });
  const notification = await createNotification({
    user_id: userId,
    type,
    title,
    message,
    task_id: task_id ?? taskId ?? null,
    project_id: project_id ?? projectId ?? null,
  });
  emitNotificationEvent(Number(userId), {
    type: 'notification_created',
    notificationId: notification.id,
  });
  res.status(201).json({ notification });
}

export async function markRead(req: any, res: Response) {
  const userId = req.user.id;
  const { id } = req.params;
  await markNotificationRead(Number(id), userId);
  emitNotificationEvent(Number(userId), {
    type: 'notifications_read',
    notificationId: Number(id),
  });
  res.status(204).send();
}

export async function markAllRead(req: any, res: Response) {
  const userId = req.user.id;
  await markAllNotificationsRead(userId);
  emitNotificationEvent(Number(userId), {
    type: 'notifications_read',
  });
  res.status(204).send();
}
