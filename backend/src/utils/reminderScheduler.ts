import { createNotificationsForUsers } from '../models/notification';
import { getProjectMemberUserIds } from '../models/projectMember';
import { getOpenTasksWithDueDates, type TaskWithProject } from '../models/task';
import { recordTaskReminder } from '../models/taskReminder';
import { emitNotificationEvent } from './notificationEvents';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function buildReminderPlan(task: TaskWithProject, now: Date) {
  const dueDate = new Date(task.due_date as string);
  const reminderKey = dueDate.toISOString();
  const timeUntilDue = dueDate.getTime() - now.getTime();

  if (timeUntilDue < 0) {
    return {
      reminderType: 'overdue' as const,
      reminderKey,
      title: `Task overdue in ${task.project_name}`,
      message: `"${task.name}" is overdue`,
    };
  }

  if (timeUntilDue <= DAY_IN_MS) {
    return {
      reminderType: 'due_soon' as const,
      reminderKey,
      title: `Task due soon in ${task.project_name}`,
      message: `"${task.name}" is due within 24 hours`,
    };
  }

  return null;
}

export async function runDueDateReminderSweep(now = new Date()) {
  const tasks = await getOpenTasksWithDueDates();

  for (const task of tasks) {
    const reminder = buildReminderPlan(task, now);
    if (!reminder) {
      continue;
    }

    const wasRecorded = await recordTaskReminder(task.id, reminder.reminderType, reminder.reminderKey);
    if (!wasRecorded) {
      continue;
    }

    const userIds = await getProjectMemberUserIds(task.project_id);
    if (userIds.length === 0) {
      continue;
    }

    const notifications = await createNotificationsForUsers({
      userIds,
      type: reminder.reminderType,
      title: reminder.title,
      message: reminder.message,
      task_id: task.id,
      project_id: task.project_id,
    });

    notifications.forEach((notification) => {
      emitNotificationEvent(notification.user_id, {
        type: 'notification_created',
        notificationId: notification.id,
      });
    });
  }
}

export function startReminderScheduler() {
  const enabled = process.env.ENABLE_REMINDER_JOBS !== 'false';
  if (!enabled) {
    return;
  }

  const intervalMs = Number(process.env.REMINDER_INTERVAL_MS ?? '60000');
  const safeIntervalMs = Number.isFinite(intervalMs) && intervalMs >= 15000 ? intervalMs : 60000;
  let running = false;

  const run = async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      await runDueDateReminderSweep();
    } catch (error) {
      console.error('Reminder sweep failed:', error);
    } finally {
      running = false;
    }
  };

  void run();
  setInterval(() => {
    void run();
  }, safeIntervalMs);
}
