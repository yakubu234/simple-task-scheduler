import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectMemberUI, AppRole } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useProjectMembers(projectId: string | null) {
  const { user, token } = useAuth();
  const [members, setMembers] = useState<ProjectMemberUI[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!projectId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch members');
      setMembers(data.members as ProjectMemberUI[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch project members.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [projectId, token]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(
    async (email: string, role: AppRole = 'editor') => {
      if (!projectId || !token) return false;
      try {
        const res = await fetch(`/api/projects/${projectId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to invite member');
        toast({ title: 'Member invited', description: `${email} has been added to the project.` });
        fetchMembers();
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to invite member.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [projectId, token, fetchMembers]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!projectId || !token) return false;
      try {
        const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to remove member');
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast({ title: 'Member removed' });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove member.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [projectId, token]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, role: AppRole) => {
      if (!projectId || !token) return false;
      try {
        const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        });
        if (!res.ok) throw new Error('Failed to update role');
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
        toast({ title: 'Role updated' });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update role.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [projectId, token]
  );

  return {
    members,
    loading,
    fetchMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
  };
}
