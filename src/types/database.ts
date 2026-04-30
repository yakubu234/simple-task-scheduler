export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type AppRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  push_subscription: any | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  owner_id: string;
  current_role?: AppRole;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: AppRole;
  invited_at: string;
  accepted_at: string | null;
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  priority_level: Priority;
  status: TaskStatus;
  due_date: string | null;
  project_id: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  task_id: string | null;
  project_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

// Frontend-friendly types (with Date objects)
export interface TaskUI {
  id: string;
  name: string;
  description?: string;
  priority: number;
  priorityLevel: Priority;
  status: TaskStatus;
  dueDate?: Date;
  projectId: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ProjectUI {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  currentRole?: AppRole;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ProjectMemberUI {
  id: string;
  projectId: string;
  userId: string;
  role: AppRole;
  invitedAt: Date;
  acceptedAt?: Date;
  // Joined data
  profile?: Profile;
}

export interface CommentUI {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  profile?: Profile;
}

export interface ActivityLogUI {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  createdAt: Date;
  // Joined data
  profile?: Profile;
}
