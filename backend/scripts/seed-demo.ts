import bcrypt from 'bcryptjs';
import { pool } from '../src/utils/db';

type DemoUser = {
  email: string;
  password: string;
  displayName: string;
};

const demoUsers: DemoUser[] = [
  { email: 'owner@taskflow.demo', password: 'password123', displayName: 'Ada Owner' },
  { email: 'admin@taskflow.demo', password: 'password123', displayName: 'Ben Admin' },
  { email: 'editor@taskflow.demo', password: 'password123', displayName: 'Cora Editor' },
  { email: 'viewer@taskflow.demo', password: 'password123', displayName: 'Dayo Viewer' },
];

async function getOrCreateUser(user: DemoUser) {
  const [existingRows] = await pool.query(
    'SELECT id, email, display_name FROM users WHERE email = ?',
    [user.email]
  );
  const existing = (existingRows as Array<{ id: number; email: string; display_name: string }>)[0];
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(user.password, 10);
  const [result]: any = await pool.query(
    'INSERT INTO users (email, password, display_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [user.email, passwordHash, user.displayName]
  );

  return {
    id: result.insertId as number,
    email: user.email,
    display_name: user.displayName,
  };
}

async function getOrCreateProject(name: string, color: string, ownerId: number) {
  const [existingRows] = await pool.query(
    'SELECT id, name, color, owner_id FROM projects WHERE name = ? AND owner_id = ?',
    [name, ownerId]
  );
  const existing = (existingRows as Array<{ id: number; name: string; color: string; owner_id: number }>)[0];
  if (existing) return existing;

  const [result]: any = await pool.query(
    'INSERT INTO projects (name, color, owner_id, created_at, updated_at, version) VALUES (?, ?, ?, NOW(), NOW(), 1)',
    [name, color, ownerId]
  );

  return {
    id: result.insertId as number,
    name,
    color,
    owner_id: ownerId,
  };
}

async function ensureProjectMember(projectId: number, userId: number, role: 'owner' | 'admin' | 'editor' | 'viewer') {
  await pool.query(
    `INSERT INTO project_members (project_id, user_id, role, invited_at, accepted_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE role = VALUES(role), accepted_at = COALESCE(project_members.accepted_at, NOW())`,
    [projectId, userId, role]
  );
}

async function ensureTask(projectId: number, createdBy: number, input: {
  name: string;
  description: string;
  priority: number;
  priorityLevel: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string | null;
}) {
  const [existingRows] = await pool.query(
    'SELECT id FROM tasks WHERE project_id = ? AND name = ?',
    [projectId, input.name]
  );
  if ((existingRows as Array<{ id: number }>).length > 0) return;

  await pool.query(
    `INSERT INTO tasks
      (name, description, priority, priority_level, status, due_date, project_id, assigned_to, created_by, created_at, updated_at, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NOW(), NOW(), 1)`,
    [input.name, input.description, input.priority, input.priorityLevel, input.status, input.dueDate, projectId, createdBy]
  );
}

async function ensureActivityLog(projectId: number, userId: number, action: string, entityType: string, entityName: string) {
  const [existingRows] = await pool.query(
    'SELECT id FROM activity_logs WHERE project_id = ? AND user_id = ? AND action = ? AND entity_type = ? AND entity_name = ?',
    [projectId, userId, action, entityType, entityName]
  );
  if ((existingRows as Array<{ id: number }>).length > 0) return;

  await pool.query(
    `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, entity_name, details, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, NULL, NOW())`,
    [projectId, userId, action, entityType, entityName]
  );
}

async function ensureNotification(userId: number, type: string, title: string, message: string, projectId: number | null) {
  const [existingRows] = await pool.query(
    'SELECT id FROM notifications WHERE user_id = ? AND type = ? AND title = ?',
    [userId, type, title]
  );
  if ((existingRows as Array<{ id: number }>).length > 0) return;

  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, task_id, project_id, \`read\`, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, 0, NOW())`,
    [userId, type, title, message, projectId]
  );
}

async function main() {
  const owner = await getOrCreateUser(demoUsers[0]);
  const admin = await getOrCreateUser(demoUsers[1]);
  const editor = await getOrCreateUser(demoUsers[2]);
  const viewer = await getOrCreateUser(demoUsers[3]);

  const project = await getOrCreateProject('MLH Fellowship Launch', '#2563eb', owner.id);

  await ensureProjectMember(project.id, owner.id, 'owner');
  await ensureProjectMember(project.id, admin.id, 'admin');
  await ensureProjectMember(project.id, editor.id, 'editor');
  await ensureProjectMember(project.id, viewer.id, 'viewer');

  await ensureTask(project.id, owner.id, {
    name: 'Draft fellowship-ready README',
    description: 'Explain the architecture, setup steps, demo accounts, and why the app demonstrates collaboration engineering.',
    priority: 1,
    priorityLevel: 'high',
    status: 'in_progress',
    dueDate: '2026-05-07',
  });
  await ensureTask(project.id, admin.id, {
    name: 'Review permissions matrix',
    description: 'Verify owner/admin/editor/viewer restrictions across task and project actions.',
    priority: 2,
    priorityLevel: 'high',
    status: 'todo',
    dueDate: '2026-05-08',
  });
  await ensureTask(project.id, editor.id, {
    name: 'Capture demo walkthrough video',
    description: 'Record notifications, activity feed, and collaboration flow for the application package.',
    priority: 3,
    priorityLevel: 'medium',
    status: 'todo',
    dueDate: '2026-05-09',
  });
  await ensureTask(project.id, viewer.id, {
    name: 'Validate view-only experience',
    description: 'Confirm a viewer can browse tasks and activity without edit controls.',
    priority: 4,
    priorityLevel: 'low',
    status: 'completed',
    dueDate: null,
  });

  await ensureActivityLog(project.id, owner.id, 'created', 'project', project.name);
  await ensureActivityLog(project.id, admin.id, 'member_role_changed', 'project_member', admin.display_name);
  await ensureNotification(admin.id, 'project_role_changed', 'Role updated in "MLH Fellowship Launch"', 'Your role is now admin', project.id);
  await ensureNotification(viewer.id, 'project_invitation', 'Added to project "MLH Fellowship Launch"', 'You were added as viewer', project.id);

  console.log('Demo seed complete.');
  console.log('Demo accounts:');
  for (const user of demoUsers) {
    console.log(`- ${user.email} / ${user.password}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
