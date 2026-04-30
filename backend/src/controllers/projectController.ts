import { Request, Response } from 'express';
import { findUserByEmail } from '../models/user';
import { getProjectsByUser, getProjectByIdForOwner, getProjectByIdForUser, createProject, updateProject, deleteProject } from '../models/project';
import { createActivityLog, getActivityLogsByProject } from '../models/activityLog';
import { addProjectMember, getProjectMemberById, getProjectMembers, removeProjectMember, updateProjectMemberRole } from '../models/projectMember';
import { addActivityClient, emitActivityEvent, removeActivityClient } from '../utils/activityEvents';
import { requireProjectRole } from '../utils/permissions';
import { createNotificationsForUsers } from '../models/notification';
import { emitNotificationEvent } from '../utils/notificationEvents';

function toActivityResponse(activity: Awaited<ReturnType<typeof getActivityLogsByProject>>[number]) {
  return {
    id: String(activity.id),
    project_id: String(activity.project_id),
    user_id: String(activity.user_id),
    action: activity.action,
    entity_type: activity.entity_type,
    entity_id: activity.entity_id ? String(activity.entity_id) : null,
    entity_name: activity.entity_name,
    details: activity.details,
    created_at: activity.created_at.toISOString(),
    profile: {
      id: String(activity.user_id),
      user_id: String(activity.user_id),
      email: activity.email,
      display_name: activity.display_name,
      avatar_url: null,
      push_subscription: null,
      notifications_enabled: false,
      created_at: activity.created_at.toISOString(),
      updated_at: activity.created_at.toISOString(),
    },
  };
}

export async function getProjects(req: any, res: Response) {
  const userId = req.user.id;
  const projects = await getProjectsByUser(userId);
  res.json({ projects });
}

export async function addProject(req: any, res: Response) {
  const userId = req.user.id;
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: 'Missing name or color' });
  const project = await createProject(name, color, userId);
  await addProjectMember(Number(project.id), Number(userId), 'owner');
  await createActivityLog({
    project_id: Number(project.id),
    user_id: Number(userId),
    action: 'created',
    entity_type: 'project',
    entity_id: Number(project.id),
    entity_name: project.name,
  });
  res.status(201).json({ project });
}

export async function editProject(req: any, res: Response) {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, color } = req.body;
  const existingProject = await getProjectByIdForUser(Number(id), Number(userId));
  if (!existingProject) return res.status(404).json({ error: 'Project not found' });
  const role = await requireProjectRole(Number(id), Number(userId), 'admin', res);
  if (!role) return;

  const project = await updateProject(Number(id), userId, { name, color });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const activity = await createActivityLog({
    project_id: Number(project.id),
    user_id: Number(userId),
    action: 'updated',
    entity_type: 'project',
    entity_id: Number(project.id),
    entity_name: project.name,
    details: {
      old_name: existingProject.name,
      new_name: project.name,
      old_color: existingProject.color,
      new_color: project.color,
    },
  });
  emitActivityEvent(Number(project.id), {
    type: 'activity_created',
    activityId: activity.id,
  });
  res.json({ project });
}

export async function removeProject(req: any, res: Response) {
  const userId = req.user.id;
  const { id } = req.params;
  const project = await getProjectByIdForOwner(Number(id), Number(userId));
  if (!project) return res.status(404).json({ error: 'Project not found' });

  await deleteProject(Number(id), userId);
  res.status(204).send();
}

export async function getProjectActivity(req: any, res: Response) {
  const userId = Number(req.user.id);
  const projectId = Number(req.params.id);
  const project = await getProjectByIdForUser(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const activities = await getActivityLogsByProject(projectId);
  res.json({ activities: activities.map(toActivityResponse) });
}

export async function streamProjectActivity(req: any, res: Response) {
  const userId = Number(req.user.id);
  const projectId = Number(req.params.id);
  const project = await getProjectByIdForUser(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('event: connected\ndata: {"ok":true}\n\n');

  const client = addActivityClient(projectId, res);
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeActivityClient(projectId, client);
  });
}

function toMemberResponse(member: Awaited<ReturnType<typeof getProjectMembers>>[number]) {
  return {
    id: String(member.id),
    projectId: String(member.project_id),
    userId: String(member.user_id),
    role: member.role,
    invitedAt: member.invited_at.toISOString(),
    acceptedAt: member.accepted_at ? member.accepted_at.toISOString() : undefined,
    profile: {
      id: String(member.user_id),
      user_id: String(member.user_id),
      email: member.email,
      display_name: member.display_name,
      avatar_url: null,
      push_subscription: null,
      notifications_enabled: false,
      created_at: member.invited_at.toISOString(),
      updated_at: member.accepted_at?.toISOString() ?? member.invited_at.toISOString(),
    },
  };
}

export async function getMembers(req: any, res: Response) {
  const userId = Number(req.user.id);
  const projectId = Number(req.params.id);
  const project = await getProjectByIdForUser(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = await getProjectMembers(projectId);
  res.json({ members: members.map(toMemberResponse) });
}

export async function inviteMember(req: any, res: Response) {
  const userId = Number(req.user.id);
  const projectId = Number(req.params.id);
  const { email, role } = req.body as { email?: string; role?: 'admin' | 'editor' | 'viewer' };
  const project = await getProjectByIdForUser(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const actorRole = await requireProjectRole(projectId, userId, 'admin', res);
  if (!actorRole) return;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !role) return res.status(400).json({ error: 'Missing email or role' });

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(400).json({
      error: 'That email has not signed up yet. Ask them to create an account first, then invite them again.',
    });
  }
  if (Number(user.id) === userId) {
    return res.status(400).json({ error: 'You are already a member of this project.' });
  }

  const member = await addProjectMember(projectId, Number(user.id), role);
  const notifications = await createNotificationsForUsers({
    userIds: [Number(user.id)],
    type: 'project_invitation',
    title: `Added to project "${project.name}"`,
    message: `You were added as ${role}`,
    project_id: projectId,
  });
  notifications.forEach((notification) => {
    emitNotificationEvent(notification.user_id, {
      type: 'notification_created',
      notificationId: notification.id,
    });
  });
  const activity = await createActivityLog({
    project_id: projectId,
    user_id: userId,
    action: 'member_invited',
    entity_type: 'project_member',
    entity_id: member.id,
    entity_name: user.display_name || user.email,
    details: { role, email: user.email },
  });
  emitActivityEvent(projectId, { type: 'activity_created', activityId: activity.id });
  res.status(201).json({ member: toMemberResponse(member) });
}

export async function editMemberRole(req: any, res: Response) {
  const userId = Number(req.user.id);
  const projectId = Number(req.params.id);
  const memberId = Number(req.params.memberId);
  const { role } = req.body as { role?: 'admin' | 'editor' | 'viewer' };
  const project = await getProjectByIdForUser(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const actorRole = await requireProjectRole(projectId, userId, 'admin', res);
  if (!actorRole) return;
  if (!role) return res.status(400).json({ error: 'Missing role' });

  const member = await getProjectMemberById(memberId);
  if (!member || member.project_id !== projectId) return res.status(404).json({ error: 'Member not found' });
  if (member.role === 'owner') return res.status(400).json({ error: 'Cannot change owner role' });

  await updateProjectMemberRole(memberId, role);
  const updatedMember = await getProjectMemberById(memberId);
  if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
  const notifications = await createNotificationsForUsers({
    userIds: [updatedMember.user_id],
    type: 'project_role_changed',
    title: `Role updated in "${project.name}"`,
    message: `Your role is now ${role}`,
    project_id: projectId,
  });
  notifications.forEach((notification) => {
    emitNotificationEvent(notification.user_id, {
      type: 'notification_created',
      notificationId: notification.id,
    });
  });

  const activity = await createActivityLog({
    project_id: projectId,
    user_id: userId,
    action: 'member_role_changed',
    entity_type: 'project_member',
    entity_id: memberId,
    entity_name: updatedMember.display_name || updatedMember.email,
    details: { old_role: member.role, new_role: role, email: updatedMember.email },
  });
  emitActivityEvent(projectId, { type: 'activity_created', activityId: activity.id });
  res.json({ member: toMemberResponse(updatedMember) });
}

export async function deleteMember(req: any, res: Response) {
  const userId = Number(req.user.id);
  const projectId = Number(req.params.id);
  const memberId = Number(req.params.memberId);
  const project = await getProjectByIdForUser(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const actorRole = await requireProjectRole(projectId, userId, 'admin', res);
  if (!actorRole) return;

  const member = await getProjectMemberById(memberId);
  if (!member || member.project_id !== projectId) return res.status(404).json({ error: 'Member not found' });
  if (member.role === 'owner') return res.status(400).json({ error: 'Cannot remove owner' });

  const notifications = await createNotificationsForUsers({
    userIds: [member.user_id],
    type: 'project_access_removed',
    title: `Removed from "${project.name}"`,
    message: 'Your access to this project was removed',
    project_id: projectId,
  });
  notifications.forEach((notification) => {
    emitNotificationEvent(notification.user_id, {
      type: 'notification_created',
      notificationId: notification.id,
    });
  });

  await removeProjectMember(memberId);
  const activity = await createActivityLog({
    project_id: projectId,
    user_id: userId,
    action: 'member_removed',
    entity_type: 'project_member',
    entity_id: memberId,
    entity_name: member.display_name || member.email,
    details: { role: member.role, email: member.email },
  });
  emitActivityEvent(projectId, { type: 'activity_created', activityId: activity.id });
  res.status(204).send();
}
