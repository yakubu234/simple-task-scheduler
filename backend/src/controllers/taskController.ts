import { Request, Response } from 'express';
import { getTasksByProject, getTasksByProjects, getTaskById, createTask, updateTask, updateTaskPriority, deleteTask } from '../models/task';
import { createActivityLog } from '../models/activityLog';
import { emitActivityEvent } from '../utils/activityEvents';
import { requireProjectRole } from '../utils/permissions';
import { createNotificationsForUsers } from '../models/notification';
import { emitNotificationEvent } from '../utils/notificationEvents';
import { getProjectMemberUserIds } from '../models/projectMember';
import { parseProjectIdsQuery } from '../utils/taskQueries';

export async function getTasks(req: any, res: Response) {
  const userId = Number(req.user.id);
  const { projectId, projectIds } = req.query;

  let tasks;
  const { normalizedProjectIds, parsedIds } = parseProjectIdsQuery(projectIds);

  if (normalizedProjectIds.trim()) {
    if (parsedIds.length === 0) {
      return res.status(400).json({ error: 'Invalid projectIds' });
    }

    for (const parsedId of parsedIds) {
      const role = await requireProjectRole(parsedId, userId, 'viewer', res);
      if (!role) return;
    }

    tasks = await getTasksByProjects(parsedIds);
  } else if (projectId) {
    const role = await requireProjectRole(Number(projectId), userId, 'viewer', res);
    if (!role) return;
    tasks = await getTasksByProject(Number(projectId));
  } else {
    return res.status(400).json({ error: 'Missing projectId or projectIds' });
  }

  res.json({ tasks });
}

export async function addTask(req: any, res: Response) {
  const userId = req.user.id;
  const taskData = req.body;
  if (!taskData.name || !taskData.project_id) return res.status(400).json({ error: 'Missing required fields' });
  const role = await requireProjectRole(Number(taskData.project_id), Number(userId), 'editor', res);
  if (!role) return;
  const task = await createTask({ ...taskData, created_by: userId });
  const recipientIds = await getProjectMemberUserIds(Number(task.project_id), Number(userId));
  const notifications = await createNotificationsForUsers({
    userIds: recipientIds,
    type: 'task_created',
    title: 'New task created',
    message: `"${task.name}" was created`,
    task_id: Number(task.id),
    project_id: Number(task.project_id),
  });
  notifications.forEach((notification) => {
    emitNotificationEvent(notification.user_id, {
      type: 'notification_created',
      notificationId: notification.id,
    });
  });
  const activity = await createActivityLog({
    project_id: Number(task.project_id),
    user_id: Number(userId),
    action: 'created',
    entity_type: 'task',
    entity_id: Number(task.id),
    entity_name: task.name,
  });
  emitActivityEvent(Number(task.project_id), {
    type: 'activity_created',
    activityId: activity.id,
  });
  res.status(201).json({ task });
}

export async function editTask(req: any, res: Response) {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;
  const existingTask = await getTaskById(Number(id));
  if (!existingTask) return res.status(404).json({ error: 'Task not found' });
  const role = await requireProjectRole(Number(existingTask.project_id), Number(userId), 'editor', res);
  if (!role) return;
  const statusChanged = updates.status && updates.status !== existingTask.status;

  const task = await updateTask(Number(id), updates);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const recipientIds = await getProjectMemberUserIds(Number(task.project_id), Number(userId));
  const notifications = await createNotificationsForUsers({
    userIds: recipientIds,
    type: statusChanged ? 'task_status_changed' : 'task_updated',
    title: statusChanged ? 'Task status changed' : 'Task updated',
    message: statusChanged
      ? `"${task.name}" is now ${task.status.replace('_', ' ')}`
      : `"${task.name}" was updated`,
    task_id: Number(task.id),
    project_id: Number(task.project_id),
  });
  notifications.forEach((notification) => {
    emitNotificationEvent(notification.user_id, {
      type: 'notification_created',
      notificationId: notification.id,
    });
  });

  const activity = await createActivityLog({
    project_id: Number(task.project_id),
    user_id: Number(userId),
    action: statusChanged ? 'status_changed' : 'updated',
    entity_type: 'task',
    entity_id: Number(task.id),
    entity_name: task.name,
    details: statusChanged
      ? {
          old_status: existingTask.status,
          new_status: task.status,
        }
      : null,
  });
  emitActivityEvent(Number(task.project_id), {
    type: 'activity_created',
    activityId: activity.id,
  });
  res.json({ task });
}

export async function editTaskPriority(req: any, res: Response) {
  const userId = Number(req.user.id);
  const { id } = req.params;
  const { priority } = req.body;

  if (typeof priority !== 'number') {
    return res.status(400).json({ error: 'Missing priority' });
  }

  const existingTask = await getTaskById(Number(id));
  if (!existingTask) return res.status(404).json({ error: 'Task not found' });
  const role = await requireProjectRole(Number(existingTask.project_id), userId, 'editor', res);
  if (!role) return;

  const task = await updateTaskPriority(Number(id), priority);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
}

export async function removeTask(req: any, res: Response) {
  const userId = req.user.id;
  const { id } = req.params;
  const existingTask = await getTaskById(Number(id));
  if (!existingTask) return res.status(404).json({ error: 'Task not found' });
  const role = await requireProjectRole(Number(existingTask.project_id), Number(userId), 'editor', res);
  if (!role) return;

  await deleteTask(Number(id));
  const recipientIds = await getProjectMemberUserIds(Number(existingTask.project_id), Number(userId));
  const notifications = await createNotificationsForUsers({
    userIds: recipientIds,
    type: 'task_deleted',
    title: 'Task deleted',
    message: `"${existingTask.name}" was deleted`,
    task_id: Number(existingTask.id),
    project_id: Number(existingTask.project_id),
  });
  notifications.forEach((notification) => {
    emitNotificationEvent(notification.user_id, {
      type: 'notification_created',
      notificationId: notification.id,
    });
  });
  const activity = await createActivityLog({
    project_id: Number(existingTask.project_id),
    user_id: Number(userId),
    action: 'deleted',
    entity_type: 'task',
    entity_id: Number(existingTask.id),
    entity_name: existingTask.name,
  });
  emitActivityEvent(Number(existingTask.project_id), {
    type: 'activity_created',
    activityId: activity.id,
  });
  res.status(204).send();
}
