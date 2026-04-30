import { pool } from '../utils/db';

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: ProjectRole;
  invited_at: Date;
  accepted_at: Date | null;
  email: string;
  display_name: string;
}

type ProjectMemberRow = Omit<ProjectMember, 'role'> & {
  role: string;
};

export async function addProjectMember(projectId: number, userId: number, role: ProjectRole): Promise<ProjectMember> {
  const [existingRows] = await pool.query(
    `SELECT pm.*, u.email, u.display_name
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ? AND pm.user_id = ?`,
    [projectId, userId]
  );
  const existing = (existingRows as ProjectMemberRow[])[0];
  if (existing) {
    await pool.query(
      'UPDATE project_members SET role = ?, accepted_at = COALESCE(accepted_at, NOW()) WHERE id = ?',
      [role, existing.id]
    );
  } else {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role, invited_at, accepted_at) VALUES (?, ?, ?, NOW(), NOW())',
      [projectId, userId, role]
    );
  }

  const [rows] = await pool.query(
    `SELECT pm.*, u.email, u.display_name
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ? AND pm.user_id = ?`,
    [projectId, userId]
  );
  const member = (rows as ProjectMemberRow[])[0];
  return { ...member, role: member.role as ProjectRole };
}

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const [rows] = await pool.query(
    `SELECT pm.*, u.email, u.display_name
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?
     ORDER BY FIELD(pm.role, 'owner', 'admin', 'editor', 'viewer'), u.display_name ASC, u.email ASC`,
    [projectId]
  );
  return (rows as ProjectMemberRow[]).map((row) => ({ ...row, role: row.role as ProjectRole }));
}

export async function getProjectMemberUserIds(projectId: number, excludeUserId?: number): Promise<number[]> {
  const [rows] = await pool.query(
    `SELECT DISTINCT user_id
     FROM (
       SELECT owner_id AS user_id
       FROM projects
       WHERE id = ?
       UNION
       SELECT pm.user_id
       FROM project_members pm
       WHERE pm.project_id = ?
     ) members
     WHERE (? IS NULL OR user_id <> ?)`,
    [projectId, projectId, excludeUserId ?? null, excludeUserId ?? null]
  );

  return (rows as Array<{ user_id: number }>).map((row) => row.user_id);
}

export async function getProjectMemberById(memberId: number): Promise<ProjectMember | null> {
  const [rows] = await pool.query(
    `SELECT pm.*, u.email, u.display_name
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.id = ?`,
    [memberId]
  );
  const member = (rows as ProjectMemberRow[])[0];
  return member ? { ...member, role: member.role as ProjectRole } : null;
}

export async function getUserProjectRole(projectId: number, userId: number): Promise<ProjectRole | null> {
  const [ownerRows] = await pool.query(
    'SELECT id FROM projects WHERE id = ? AND owner_id = ?',
    [projectId, userId]
  );
  if ((ownerRows as Array<{ id: number }>).length > 0) {
    return 'owner';
  }

  const [rows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  const row = (rows as Array<{ role: string }>)[0];
  return row ? (row.role as ProjectRole) : null;
}

export async function updateProjectMemberRole(memberId: number, role: ProjectRole): Promise<void> {
  await pool.query('UPDATE project_members SET role = ? WHERE id = ?', [role, memberId]);
}

export async function removeProjectMember(memberId: number): Promise<void> {
  await pool.query('DELETE FROM project_members WHERE id = ?', [memberId]);
}
