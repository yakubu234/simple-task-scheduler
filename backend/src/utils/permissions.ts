import type { Response } from 'express';
import { getUserProjectRole, type ProjectRole } from '../models/projectMember';

export const roleOrder: ProjectRole[] = ['viewer', 'editor', 'admin', 'owner'];

export function hasRequiredRole(role: ProjectRole | null, minimumRole: ProjectRole) {
  if (!role) return false;
  return roleOrder.indexOf(role) >= roleOrder.indexOf(minimumRole);
}

export function makeRequireProjectRole(
  getRole: (projectId: number, userId: number) => Promise<ProjectRole | null>
) {
  return async function requireProjectRole(projectId: number, userId: number, minimumRole: ProjectRole, res: Response) {
    const role = await getRole(projectId, userId);
    if (!role) {
      res.status(403).json({ error: 'Access denied' });
      return null;
    }

    if (!hasRequiredRole(role, minimumRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return null;
    }

    return role;
  };
}

export const requireProjectRole = makeRequireProjectRole(getUserProjectRole);
