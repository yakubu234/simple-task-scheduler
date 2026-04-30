import { pool } from '../utils/db';

export async function recordTaskReminder(taskId: number, reminderType: 'due_soon' | 'overdue', reminderKey: string) {
  try {
    await pool.query(
      'INSERT INTO task_reminder_logs (task_id, reminder_type, reminder_key, created_at) VALUES (?, ?, ?, NOW())',
      [taskId, reminderType, reminderKey]
    );
    return true;
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return false;
    }
    throw error;
  }
}
