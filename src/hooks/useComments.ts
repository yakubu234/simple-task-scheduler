import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CommentUI } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useComments(taskId: string | null) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<CommentUI[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId || !token) {
      setComments([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load comments');
      setComments(
        (data.comments as Array<any>).map((comment) => ({
          id: comment.id,
          taskId: comment.task_id,
          userId: comment.user_id,
          content: comment.content,
          createdAt: new Date(comment.created_at),
          updatedAt: new Date(comment.updated_at),
          profile: comment.profile,
        }))
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load comments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (content: string) => {
      if (!user || !taskId || !token) return false;
      try {
        const res = await fetch(`/api/tasks/${taskId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error('Failed to add comment');
        const data = await res.json();
        const comment = data.comment;
        setComments((prev) => [
          ...prev,
          {
            id: comment.id,
            taskId: comment.task_id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: new Date(comment.created_at),
            updatedAt: new Date(comment.updated_at),
            profile: comment.profile,
          },
        ]);
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add comment.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, taskId, token]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!token) return false;
      try {
        const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete comment');
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete comment.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [taskId, token]
  );

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    fetchComments,
  };
}
