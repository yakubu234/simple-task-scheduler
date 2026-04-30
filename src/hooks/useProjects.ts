import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Project, ProjectUI } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useProjects() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');
      setProjects(
        (data.projects as Project[]).map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          ownerId: p.owner_id,
          currentRole: p.current_role,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          version: p.version,
        }))
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load projects.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [user, token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (name: string, color: string = '#3b82f6') => {
      if (!user || !token) return null;
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, color }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create project');
        const project = data.project as Project;
        const projectUI: ProjectUI = {
          id: project.id,
          name: project.name,
          color: project.color,
          ownerId: project.owner_id,
          currentRole: project.current_role ?? 'owner',
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at),
          version: project.version,
        };
        setProjects((prev) => [projectUI, ...prev]);
        toast({ title: 'Project created', description: `"${name}" has been created.` });
        return projectUI;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create project.',
          variant: 'destructive',
        });
        return null;
      }
    },
    [user, token]
  );

  const updateProject = useCallback(
    async (projectId: string, updates: { name?: string; color?: string }) => {
      if (!token) return false;
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update project');
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
          )
        );
        toast({ title: 'Project updated' });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update project.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [token]
  );

  const deleteProject = useCallback(async (projectId: string) => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({ title: 'Project deleted' });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project.',
        variant: 'destructive',
      });
      return false;
    }
  }, [token]);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
