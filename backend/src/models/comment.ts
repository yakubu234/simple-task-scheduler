import { pool } from '../utils/db';

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  email: string;
  display_name: string;
}

export async function getCommentsByTask(taskId: number): Promise<Comment[]> {
  const [rows] = await pool.query(
    `SELECT c.*, u.email, u.display_name
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [taskId]
  );
  return rows as Comment[];
}

export async function getCommentById(id: number): Promise<Comment | null> {
  const [rows] = await pool.query(
    `SELECT c.*, u.email, u.display_name
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [id]
  );
  return (rows as Comment[])[0] ?? null;
}

export async function createComment(taskId: number, userId: number, content: string): Promise<Comment> {
  const [result]: any = await pool.query(
    'INSERT INTO comments (task_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [taskId, userId, content]
  );
  const comment = await getCommentById(result.insertId);
  if (!comment) {
    throw new Error('Failed to load created comment');
  }

  return comment;
}

export async function deleteComment(id: number): Promise<void> {
  await pool.query('DELETE FROM comments WHERE id = ?', [id]);
}
