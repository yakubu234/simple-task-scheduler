import { Response } from 'express';
import { createActivityLog } from '../models/activityLog';
import { createComment, deleteComment, getCommentById, getCommentsByTask } from '../models/comment';
import { createNotificationsForUsers } from '../models/notification';
import { getProjectMemberUserIds, getUserProjectRole } from '../models/projectMember';
import { getTaskById } from '../models/task';
import { findUsersByEmails } from '../models/user';
import { emitActivityEvent } from '../utils/activityEvents';
import { extractMentionedEmails } from '../utils/commentMentions';
import { emitNotificationEvent } from '../utils/notificationEvents';
import { hasRequiredRole } from '../utils/permissions';

function toCommentResponse(comment: Awaited<ReturnType<typeof getCommentsByTask>>[number]) {
  return {
    id: String(comment.id),
    task_id: String(comment.task_id),
    user_id: String(comment.user_id),
    content: comment.content,
    created_at: comment.created_at.toISOString(),
    updated_at: comment.updated_at.toISOString(),
    profile: {
      id: String(comment.user_id),
      user_id: String(comment.user_id),
      email: comment.email,
      display_name: comment.display_name,
      avatar_url: null,
      push_subscription: null,
      notifications_enabled: false,
      created_at: comment.created_at.toISOString(),
      updated_at: comment.updated_at.toISOString(),
    },
  };
}

export async function getTaskComments(req: any, res: Response) {
  const userId = Number(req.user.id);
  const taskId = Number(req.params.id);
  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const role = await getUserProjectRole(task.project_id, userId);
  if (!hasRequiredRole(role, 'viewer')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const comments = await getCommentsByTask(taskId);
  res.json({ comments: comments.map(toCommentResponse) });
}

export async function addTaskComment(req: any, res: Response) {
  const userId = Number(req.user.id);
  const taskId = Number(req.params.id);
  const content = String(req.body?.content ?? '').trim();
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const role = await getUserProjectRole(task.project_id, userId);
  if (!hasRequiredRole(role, 'viewer')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const comment = await createComment(taskId, userId, content);
  const mentionedEmails = extractMentionedEmails(content);
  if (mentionedEmails.length > 0) {
    const mentionedUsers = await findUsersByEmails(mentionedEmails);
    const projectUserIds = new Set(await getProjectMemberUserIds(task.project_id));
    const mentionedRecipientIds = mentionedUsers
      .filter((user) => user.id !== userId && projectUserIds.has(user.id))
      .map((user) => user.id);

    const mentionNotifications = await createNotificationsForUsers({
      userIds: mentionedRecipientIds,
      type: 'comment_mention',
      title: `Mentioned in a comment on "${task.name}"`,
      message: content.length > 140 ? `${content.slice(0, 137)}...` : content,
      task_id: task.id,
      project_id: task.project_id,
    });

    mentionNotifications.forEach((notification) => {
      emitNotificationEvent(notification.user_id, {
        type: 'notification_created',
        notificationId: notification.id,
      });
    });
  }

  const activity = await createActivityLog({
    project_id: task.project_id,
    user_id: userId,
    action: 'comment_added',
    entity_type: 'comment',
    entity_id: comment.id,
    entity_name: task.name,
    details: { task_id: task.id },
  });
  emitActivityEvent(task.project_id, { type: 'activity_created', activityId: activity.id });

  res.status(201).json({ comment: toCommentResponse(comment) });
}

export async function removeTaskComment(req: any, res: Response) {
  const userId = Number(req.user.id);
  const taskId = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comment = await getCommentById(commentId);
  if (!comment || comment.task_id !== taskId) return res.status(404).json({ error: 'Comment not found' });

  const role = await getUserProjectRole(task.project_id, userId);
  const canModerate = hasRequiredRole(role, 'admin');
  if (comment.user_id !== userId && !canModerate) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  await deleteComment(commentId);
  const activity = await createActivityLog({
    project_id: task.project_id,
    user_id: userId,
    action: 'comment_deleted',
    entity_type: 'comment',
    entity_id: comment.id,
    entity_name: task.name,
    details: { task_id: task.id },
  });
  emitActivityEvent(task.project_id, { type: 'activity_created', activityId: activity.id });
  res.status(204).send();
}
