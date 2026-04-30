import { useState } from "react";
import { TaskStatus } from "@/types/database";
import { TaskItem } from "./TaskItem";
import { Pagination } from "./Pagination";
import { ListTodo, Search } from "lucide-react";

// Compatible task interface for TaskList
interface TaskListTask {
  id: string;
  name: string;
  description?: string;
  priority: number;
  priorityLevel: "high" | "medium" | "low";
  status: TaskStatus;
  dueDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskListProps {
  tasks: TaskListTask[];
  onReorder: (tasks: TaskListTask[]) => void;
  onEdit: (id: string, updates: Partial<TaskListTask>) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  canManageTask?: (task: TaskListTask) => boolean;
  onTaskClick?: (task: TaskListTask) => void;
  selectedTaskIndex?: number;
  isSearching?: boolean;
}

export function TaskList({
  tasks,
  onReorder,
  onEdit,
  onDelete,
  onStatusChange,
  canManageTask = () => true,
  onTaskClick,
  selectedTaskIndex,
  isSearching = false,
}: TaskListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Calculate pagination
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canManageTask(tasks[startIndex + index])) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      // Adjust indices for pagination
      const actualDragIndex = startIndex + dragIndex;
      const actualDropIndex = startIndex + dragOverIndex;

      const newTasks = [...tasks];
      const [removed] = newTasks.splice(actualDragIndex, 1);
      newTasks.splice(actualDropIndex, 0, removed);

      const updatedTasks = newTasks.map((task, idx) => ({
        ...task,
        priority: idx + 1,
        updatedAt: new Date(),
      }));

      onReorder(updatedTasks);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {isSearching ? (
            <Search className="w-8 h-8 text-muted-foreground" />
          ) : (
            <ListTodo className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          {isSearching ? "No tasks found" : "No tasks yet"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isSearching
            ? "Try adjusting your search or filters"
            : "Create your first task to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {paginatedTasks.map((task, index) => {
          const actualIndex = startIndex + index;
          return (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onClick={() => onTaskClick?.(task)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              canManage={canManageTask(task)}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index && dragIndex !== index}
              isSelected={selectedTaskIndex === actualIndex}
            />
          );
        })}
      </div>

      {tasks.length > 5 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={tasks.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}
