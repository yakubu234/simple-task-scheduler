import { pool } from '../utils/db';

export interface Project {
  id: number;
  name: string;
  color: string;
  owner_id: number;
  current_role?: 'owner' | 'admin' | 'editor' | 'viewer';
  created_at: Date;
  updated_at: Date;
  version: number;
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  const [rows] = await pool.query(
    `SELECT p.*,
            CASE
              WHEN p.owner_id = ? THEN 'owner'
              ELSE pm.role
            END AS \`current_role\`
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
     WHERE p.owner_id = ? OR pm.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId, userId, userId, userId]
  );
  return rows as Project[];
}

export async function getProjectByIdForOwner(id: number, ownerId: number): Promise<Project | null> {
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ? AND owner_id = ?', [id, ownerId]);
  return (rows as Project[])[0] || null;
}

export async function getProjectByIdForUser(id: number, userId: number): Promise<Project | null> {
  const [rows] = await pool.query(
    `SELECT DISTINCT p.*
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [id, userId, userId]
  );
  return (rows as Project[])[0] || null;
}

export async function createProject(name: string, color: string, ownerId: number): Promise<Project> {
  const [result]: any = await pool.query(
    'INSERT INTO projects (name, color, owner_id, created_at, updated_at, version) VALUES (?, ?, ?, NOW(), NOW(), 1)',
    [name, color, ownerId]
  );
  return {
    id: result.insertId,
    name,
    color,
    owner_id: ownerId,
    created_at: new Date(),
    updated_at: new Date(),
    version: 1,
  };
}

export async function updateProject(
  id: number,
  _ownerId: number,
  updates: Partial<Pick<Project, 'name' | 'color'>>
): Promise<Project | null> {
  const filteredEntries = Object.entries(updates).filter(([, value]) => value !== undefined);
  const fields = filteredEntries.map(([key]) => `${key} = ?`).join(', ');
  const values = filteredEntries.map(([, value]) => value);

  if (!fields) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    return (rows as Project[])[0] || null;
  }

  await pool.query(`UPDATE projects SET ${fields}, updated_at = NOW(), version = version + 1 WHERE id = ?`, [...values, id]);
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  return (rows as Project[])[0] || null;
}

export async function deleteProject(id: number, ownerId: number): Promise<void> {
  await pool.query('DELETE FROM projects WHERE id = ? AND owner_id = ?', [id, ownerId]);
}
