import { useState, useCallback, useMemo, useRef } from "react";
import { TaskUI, Priority, TaskStatus } from "@/types/database";
import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { AddTaskForm } from "@/components/AddTaskForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TaskDetailsDialog } from "@/components/TaskDetailsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SortField, SortDirection } from "@/components/SortDropdown";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { canEditRole, canManageTaskForProject, getProjectRoleMap } from "@/lib/projectRoles";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { projects, loading: projectsLoading, createProject } = useProjects();
  
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "all">("all");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<TaskUI | null>(null);
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Keyboard navigation
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(-1);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get project IDs for task fetching
  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const projectRoleMap = useMemo(() => getProjectRoleMap(projects), [projects]);
  const currentProject = useMemo(
    () => projects.find((project) => project.id === selectedProject),
    [projects, selectedProject]
  );

  const canManageTask = useCallback(
    (projectId: string) => canManageTaskForProject(projectRoleMap, projectId),
    [projectRoleMap]
  );
  const canAddToSelectedProject =
    selectedProject !== "all" && currentProject ? canManageTask(currentProject.id) : false;
  
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  } = useTasks(projectIds);

  // Calculate status counts for the current project filter
  const statusCounts = useMemo(() => {
    const projectFiltered =
      selectedProject === "all"
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProject);

    return {
      all: projectFiltered.length,
      todo: projectFiltered.filter((t) => t.status === "todo").length,
      in_progress: projectFiltered.filter((t) => t.status === "in_progress").length,
      completed: projectFiltered.filter((t) => t.status === "completed").length,
    };
  }, [tasks, selectedProject]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered =
      selectedProject === "all"
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProject);

    if (selectedStatus !== "all") {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "priority":
          comparison = a.priority - b.priority;
          break;
        case "dueDate":
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [tasks, selectedProject, selectedStatus, searchQuery, sortField, sortDirection]);

  const taskToDelete = useMemo(() => {
    return tasks.find((t) => t.id === deleteTaskId);
  }, [tasks, deleteTaskId]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => {
      if (canAddToSelectedProject) {
        setShowAddForm(true);
      }
    },
    onEscape: () => {
      setShowAddForm(false);
      setSelectedTaskIndex(-1);
      setDeleteTaskId(null);
    },
    onNavigateDown: () => {
      setSelectedTaskIndex((prev) =>
        prev < filteredTasks.length - 1 ? prev + 1 : prev
      );
    },
    onNavigateUp: () => {
      setSelectedTaskIndex((prev) => (prev > 0 ? prev - 1 : 0));
    },
    onToggleComplete: () => {
      if (selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length) {
        const task = filteredTasks[selectedTaskIndex];
        if (canManageTask(task.projectId)) {
          handleStatusChange(task.id, task.status === "completed" ? "todo" : "completed");
        }
      }
    },
    onDelete: () => {
      if (selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length) {
        const task = filteredTasks[selectedTaskIndex];
        if (canManageTask(task.projectId)) {
          setDeleteTaskId(task.id);
        }
      }
    },
    onSearch: () => {
      searchInputRef.current?.focus();
    },
  });

  const handleSortChange = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  const handleAddTask = useCallback(
    async (
      name: string,
      priorityLevel: Priority,
      description?: string,
      dueDate?: Date,
      status: TaskStatus = "todo"
    ) => {
      const projectId = selectedProject === "all" ? undefined : selectedProject;
      
      if (!projectId || !canManageTask(projectId)) {
        return;
      }

      await createTask({
        name,
        description,
        priorityLevel,
        status,
        dueDate,
        projectId,
      });

      setShowAddForm(false);
    },
    [selectedProject, createTask, canManageTask]
  );

  const handleEditTask = useCallback(
    async (id: string, updates: Partial<TaskUI>) => {
      await updateTask(id, {
        name: updates.name,
        description: updates.description,
        priorityLevel: updates.priorityLevel,
        status: updates.status,
        dueDate: updates.dueDate,
      });
    },
    [updateTask]
  );

  const handleStatusChange = useCallback(
    async (id: string, status: TaskStatus) => {
      await updateTask(id, { status });
    },
    [updateTask]
  );

  const handleDeleteTask = useCallback((id: string) => {
    setDeleteTaskId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTaskId) return;

    await deleteTask(deleteTaskId);
    setDeleteTaskId(null);
    setSelectedTaskIndex(-1);
  }, [deleteTaskId, deleteTask]);

  const handleReorderTasks = useCallback(
    async (reorderedTasks: TaskUI[]) => {
      await reorderTasks(
        reorderedTasks.map((t) => ({ id: t.id, priority: t.priority }))
      );
    },
    [reorderTasks]
  );

  const handleAddProject = useCallback(
    async (name: string) => {
      const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
      const newProject = await createProject(name, colors[projects.length % colors.length]);
      if (newProject) {
        setSelectedProject(newProject.id);
      }
    },
    [projects.length, createProject]
  );

  const isLoading = projectsLoading || tasksLoading;

  // Convert TaskUI to the format expected by TaskList
  const tasksForList = filteredTasks.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    priority: t.priority,
    priorityLevel: t.priorityLevel,
    status: t.status,
    dueDate: t.dueDate,
    projectId: t.projectId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header
        ref={searchInputRef}
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        onAddProject={handleAddProject}
        taskCount={filteredTasks.length}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <AddTaskForm
            onAdd={handleAddTask}
            forceExpanded={showAddForm}
            disabled={!canAddToSelectedProject}
            disabledMessage={
              selectedProject === "all"
                ? "Select an editable project to add tasks."
                : "You have view-only access in this project."
            }
          />
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                Create your first project to get started!
              </p>
            </div>
          ) : (
            <TaskList
              tasks={tasksForList}
              onReorder={handleReorderTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              canManageTask={(task) => canManageTask(task.projectId)}
              onTaskClick={(task) => {
                const fullTask = tasks.find((t) => t.id === task.id);
                if (fullTask) setSelectedTaskForDetails(fullTask);
              }}
              selectedTaskIndex={selectedTaskIndex}
              isSearching={!!searchQuery.trim()}
            />
          )}
        </div>
      </main>

      <DeleteConfirmDialog
        isOpen={!!deleteTaskId}
        taskName={taskToDelete?.name || ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTaskId(null)}
      />

      <TaskDetailsDialog
        open={!!selectedTaskForDetails}
        onOpenChange={(open) => !open && setSelectedTaskForDetails(null)}
        task={selectedTaskForDetails ? {
          id: selectedTaskForDetails.id,
          name: selectedTaskForDetails.name,
          description: selectedTaskForDetails.description,
          status: selectedTaskForDetails.status,
          priorityLevel: selectedTaskForDetails.priorityLevel,
          dueDate: selectedTaskForDetails.dueDate,
          assignedTo: selectedTaskForDetails.assignedTo,
          createdAt: selectedTaskForDetails.createdAt,
          projectId: selectedTaskForDetails.projectId,
        } : null}
      />
    </div>
  );
}
