import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { TaskStatus, Priority } from '@/types/database';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    name: string;
    description?: string;
    status: TaskStatus;
    priorityLevel: Priority;
    dueDate?: Date;
    assignedTo?: string;
    createdAt: Date;
    projectId?: string;
  } | null;
}

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-green-500/20 text-green-600',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-600',
  medium: 'bg-yellow-500/20 text-yellow-600',
  low: 'bg-blue-500/20 text-blue-600',
};

export function TaskDetailsDialog({ open, onOpenChange, task }: TaskDetailsDialogProps) {
  const { user } = useAuth();
  const [draftComment, setDraftComment] = useState('');
  const { comments, loading, addComment, deleteComment } = useComments(task?.id ?? null);

  useEffect(() => {
    if (!open) {
      setDraftComment('');
    }
  }, [open]);

  if (!task) return null;

  const handleAddComment = async () => {
    if (!draftComment.trim()) return;
    const created = await addComment(draftComment.trim());
    if (created) {
      setDraftComment('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.name}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusColors[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge className={priorityColors[task.priorityLevel]}>
                {task.priorityLevel} priority
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-4 mt-4">
          {task.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {task.dueDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Due: {format(task.dueDate, 'PPP')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Created: {format(task.createdAt, 'PPP')}</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Comments & Mentions</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Mention a teammate with <code>@email@example.com</code> to notify them.
            </p>
            <div className="space-y-2">
              <Textarea
                value={draftComment}
                onChange={(event) => setDraftComment(event.target.value)}
                placeholder="Add a comment or mention a collaborator..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={() => void handleAddComment()} disabled={!draftComment.trim()}>
                  Post comment
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-56 rounded-md border border-border">
              <div className="space-y-3 p-3">
                {loading && (
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                )}
                {!loading && comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Start the discussion here.
                  </p>
                )}
                {comments.map((comment) => {
                  const canDelete = comment.userId === user?.id;

                  return (
                    <div key={comment.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {comment.profile?.display_name || comment.profile?.email || 'Teammate'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(comment.createdAt, 'PPP p')}
                          </p>
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void deleteComment(comment.id)}
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                        {comment.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
