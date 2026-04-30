import { pool } from '../utils/db';

export interface ActivityLog {
  id: number;
  project_id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: Date;
  email: string;
  display_name: string;
}

type ActivityLogRow = Omit<ActivityLog, 'details'> & {
  details: string | null;
};

export async function getActivityLogsByProject(projectId: number): Promise<ActivityLog[]> {
  const [rows] = await pool.query(
    `SELECT al.*, u.email, u.display_name
     FROM activity_logs al
     JOIN users u ON u.id = al.user_id
     WHERE al.project_id = ?
     ORDER BY al.created_at DESC
     LIMIT 100`,
    [projectId]
  );

  return (rows as ActivityLogRow[]).map((row) => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : null,
  }));
}

export async function createActivityLog(input: {
  project_id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  entity_name?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<ActivityLog> {
  const [result]: any = await pool.query(
    `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, entity_name, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      input.project_id,
      input.user_id,
      input.action,
      input.entity_type,
      input.entity_id ?? null,
      input.entity_name ?? null,
      input.details ? JSON.stringify(input.details) : null,
    ]
  );

  const [rows] = await pool.query(
    `SELECT al.*, u.email, u.display_name
     FROM activity_logs al
     JOIN users u ON u.id = al.user_id
     WHERE al.id = ?`,
    [result.insertId]
  );

  const row = (rows as ActivityLogRow[])[0];
  return {
    ...row,
    details: row.details ? JSON.parse(row.details) : null,
  };
}
