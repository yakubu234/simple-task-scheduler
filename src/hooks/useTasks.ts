import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskUI, Priority, TaskStatus } from '@/types/database';
import { toast } from '@/hooks/use-toast';

function taskToUI(task: Task): TaskUI {
  return {
    id: task.id,
    name: task.name,
    description: task.description || undefined,
    priority: task.priority,
    priorityLevel: task.priority_level,
    status: task.status,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    projectId: task.project_id,
    assignedTo: task.assigned_to || undefined,
    createdBy: task.created_by,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    version: task.version,
  };
}

export function useTasks(projectIds: string[]) {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<TaskUI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !token || projectIds.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectIds: projectIds.join(','),
      });
      const res = await fetch(`/api/tasks?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tasks');
      setTasks((data.tasks as Task[]).map(taskToUI));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tasks.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [user, token, projectIds]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (taskData: {
      name: string;
      description?: string;
      priorityLevel: Priority;
      status?: TaskStatus;
      dueDate?: Date;
      projectId: string;
    }) => {
      if (!user || !token) return null;

      // Calculate priority (next available in project)
      const projectTasks = tasks.filter((t) => t.projectId === taskData.projectId);
      const nextPriority = projectTasks.length + 1;

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: taskData.name,
            description: taskData.description,
            priority: nextPriority,
            priority_level: taskData.priorityLevel,
            status: taskData.status || 'todo',
            due_date: taskData.dueDate?.toISOString().split('T')[0],
            project_id: taskData.projectId,
            created_by: user.id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create task');
        const task = taskToUI(data.task as Task);
        setTasks((prev) => [...prev, task]);
        toast({ title: 'Task created', description: `"${task.name}" has been added.` });
        return task;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create task.',
          variant: 'destructive',
        });
        return null;
      }
    },
    [user, token, tasks]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<{
        name: string;
        description: string;
        priorityLevel: Priority;
        status: TaskStatus;
        dueDate: Date | null;
        assignedTo: string | null;
      }>
    ) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !token) return false;

      const dbUpdates: Partial<Task> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.priorityLevel !== undefined) dbUpdates.priority_level = updates.priorityLevel;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.dueDate !== undefined) {
        dbUpdates.due_date = updates.dueDate?.toISOString().split('T')[0] || null;
      }
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dbUpdates),
        });
        if (!res.ok) throw new Error('Failed to update task');
        const data = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? taskToUI(data.task) : t))
        );
        toast({ title: 'Task updated' });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update task.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [tasks, token]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !token) return false;

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete task');
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast({ title: 'Task deleted', description: `"${task.name}" has been removed.` });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete task.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [tasks, token]
  );

  const reorderTasks = useCallback(
    async (reorderedTasks: { id: string; priority: number }[]) => {
      if (!token) return;
      // Update locally first (optimistic)
      setTasks((prev) => {
        const priorityMap = new Map(reorderedTasks.map((t) => [t.id, t.priority]));
        return prev.map((t) => ({
          ...t,
          priority: priorityMap.get(t.id) ?? t.priority,
        }));
      });

      // Update in database
      for (const { id, priority } of reorderedTasks) {
        await fetch(`/api/tasks/${id}/priority`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priority }),
        });
      }

      toast({ title: 'Task order updated' });
    },
    [token]
  );

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
}
