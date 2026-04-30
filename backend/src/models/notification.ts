import { pool } from '../utils/db';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string | null;
  task_id: number | null;
  project_id: number | null;
  read: boolean;
  created_at: Date;
}

export async function getNotificationsByUser(userId: number): Promise<Notification[]> {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
  return rows as Notification[];
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification> {
  const [result]: any = await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, task_id, project_id, `read`, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())',
    [notification.user_id, notification.type, notification.title, notification.message, notification.task_id, notification.project_id]
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  return (rows as Notification[])[0];
}

export async function createNotificationsForUsers(input: {
  userIds: number[];
  type: string;
  title: string;
  message?: string | null;
  task_id?: number | null;
  project_id?: number | null;
}): Promise<Notification[]> {
  const created: Notification[] = [];

  for (const userId of input.userIds) {
    const notification = await createNotification({
      user_id: userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      task_id: input.task_id ?? null,
      project_id: input.project_id ?? null,
    });
    created.push(notification);
  }

  return created;
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  await pool.query('UPDATE notifications SET `read` = 1 WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await pool.query('UPDATE notifications SET `read` = 1 WHERE user_id = ?', [userId]);
}
