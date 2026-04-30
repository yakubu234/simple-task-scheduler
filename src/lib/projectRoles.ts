import { AppRole, ProjectUI, TaskUI } from '@/types/database';

export function getRoleLabel(role?: AppRole) {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
    default:
      return 'Member';
  }
}

export function getRoleBadgeClass(role?: AppRole) {
  switch (role) {
    case 'owner':
      return 'bg-amber-500/15 text-amber-700 border-amber-300/40';
    case 'admin':
      return 'bg-sky-500/15 text-sky-700 border-sky-300/40';
    case 'editor':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-300/40';
    case 'viewer':
      return 'bg-slate-500/15 text-slate-700 border-slate-300/40';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function canEditRole(role?: AppRole) {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function canManageProjectSettings(role?: AppRole) {
  return role === 'owner' || role === 'admin';
}

export function getProjectRoleMap(projects: ProjectUI[]) {
  return new Map(projects.map((project) => [project.id, project.currentRole ?? 'viewer']));
}

export function canManageTaskForProject(projectRoleMap: Map<string, AppRole>, projectId: string) {
  return canEditRole(projectRoleMap.get(projectId));
}

export function getProjectRoleForTask(projectRoleMap: Map<string, AppRole>, task: Pick<TaskUI, 'projectId'>) {
  return projectRoleMap.get(task.projectId);
}
