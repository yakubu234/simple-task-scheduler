import { AppRole } from '@/types/database';
import { cn } from '@/lib/utils';
import { getRoleBadgeClass, getRoleLabel } from '@/lib/projectRoles';

interface ProjectRoleBadgeProps {
  role?: AppRole;
  compact?: boolean;
}

export function ProjectRoleBadge({ role, compact = false }: ProjectRoleBadgeProps) {
  if (!role) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        getRoleBadgeClass(role)
      )}
      title={`Your role: ${getRoleLabel(role)}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}
