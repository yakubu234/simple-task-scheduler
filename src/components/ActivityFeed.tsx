import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Edit, Trash2, CheckCircle, Clock, MessageSquare, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityLogUI } from '@/types/database';

interface ActivityFeedProps {
  projectId: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-4 w-4 text-green-500" />,
  updated: <Edit className="h-4 w-4 text-blue-500" />,
  deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  status_changed: <Clock className="h-4 w-4 text-yellow-500" />,
  assigned: <UserPlus className="h-4 w-4 text-purple-500" />,
  commented: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
};

const actionLabels: Record<string, (activity: ActivityLogUI) => string> = {
  created: (a) => `created task "${a.entityName}"`,
  updated: (a) => `updated task "${a.entityName}"`,
  deleted: (a) => `deleted task "${a.entityName}"`,
  status_changed: (a) => {
    const details = a.details as { old_status?: string; new_status?: string } | undefined;
    return `changed "${a.entityName}" status to ${details?.new_status?.replace('_', ' ') || 'unknown'}`;
  },
  assigned: (a) => `assigned task "${a.entityName}"`,
  commented: (a) => `commented on "${a.entityName}"`,
};

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { user } = useAuth();
  const { activities, loading } = useActivityFeed(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No activity yet. Start creating tasks!
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {activities.map((activity) => {
            const initials = (activity.profile?.display_name || activity.profile?.email || 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const isOwn = activity.userId === user?.id;
            const icon = actionIcons[activity.action] || <Edit className="h-4 w-4" />;
            const label = actionLabels[activity.action]?.(activity) || `performed ${activity.action}`;

            return (
              <div key={activity.id} className="relative flex gap-4 pl-10">
                {/* Icon on timeline */}
                <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      {isOwn ? 'You' : activity.profile?.display_name || 'Someone'}
                    </span>
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                  </p>

                  {/* Show comment preview if available */}
                  {activity.action === 'commented' && activity.details?.preview && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm italic">
                      "{activity.details.preview}..."
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
