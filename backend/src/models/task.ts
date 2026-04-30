import { pool } from '../utils/db';

export interface Task {
  id: number;
  name: string;
  description: string | null;
  priority: number;
  priority_level: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  due_date: string | null;
  project_id: number;
  assigned_to: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  version: number;
}

export interface TaskWithProject extends Task {
  project_name: string;
}

export async function getTasksByProject(projectId: number): Promise<Task[]> {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE project_id = ? ORDER BY priority ASC', [projectId]);
  return rows as Task[];
}

export async function getTasksByProjects(projectIds: number[]): Promise<Task[]> {
  if (projectIds.length === 0) return [];

  const placeholders = projectIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT * FROM tasks WHERE project_id IN (${placeholders}) ORDER BY project_id ASC, priority ASC`,
    projectIds
  );
  return rows as Task[];
}

export async function getTaskById(id: number): Promise<Task | null> {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return (rows as Task[])[0] || null;
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<Task> {
  const [result]: any = await pool.query(
    'INSERT INTO tasks (name, description, priority, priority_level, status, due_date, project_id, assigned_to, created_by, created_at, updated_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)',
    [task.name, task.description, task.priority, task.priority_level, task.status, task.due_date, task.project_id, task.assigned_to, task.created_by]
  );
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  return (rows as Task[])[0];
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  if (!fields) return null;
  await pool.query(`UPDATE tasks SET ${fields}, updated_at = NOW(), version = version + 1 WHERE id = ?`, [...values, id]);
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return (rows as Task[])[0] || null;
}

export async function updateTaskPriority(id: number, priority: number): Promise<Task | null> {
  await pool.query('UPDATE tasks SET priority = ?, updated_at = NOW(), version = version + 1 WHERE id = ?', [priority, id]);
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return (rows as Task[])[0] || null;
}

export async function deleteTask(id: number): Promise<void> {
  await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function getOpenTasksWithDueDates(): Promise<TaskWithProject[]> {
  const [rows] = await pool.query(
    `SELECT t.*, p.name AS project_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE t.due_date IS NOT NULL AND t.status <> 'completed'
     ORDER BY t.due_date ASC`
  );
  return rows as TaskWithProject[];
}
