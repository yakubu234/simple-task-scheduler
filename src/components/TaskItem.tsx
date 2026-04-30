import { useState } from "react";
import { Priority, TaskStatus } from "@/types/database";
import { GripVertical, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

// Local task interface for TaskItem
interface TaskItemTask {
  id: string;
  name: string;
  description?: string;
  priority: number;
  priorityLevel: Priority;
  status: TaskStatus;
  dueDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskItemProps {
  task: TaskItemTask;
  index: number;
  onEdit: (id: string, updates: Partial<TaskItemTask>) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  canManage?: boolean;
  onClick?: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  isSelected?: boolean;
}

const priorityColors: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

const priorityLabels: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function TaskItem({
  task,
  index,
  onEdit,
  onDelete,
  onStatusChange,
  canManage = true,
  onClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
  isSelected = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editDescription, setEditDescription] = useState(task.description || "");

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(task.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(task.name);
    setEditDescription(task.description || "");
    setIsEditing(false);
  };

  const handleStatusToggle = () => {
    const newStatus: TaskStatus = task.status === "completed" ? "todo" : "completed";
    onStatusChange(task.id, newStatus);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDueDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
  const isCompleted = task.status === "completed";

  return (
    <div
      draggable={!isEditing && canManage}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={cn(
        "task-item group animate-fade-in",
        isDragging && "task-dragging",
        isDragOver && "task-drop-target",
        isCompleted && "opacity-60",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          className={cn(
            "flex-shrink-0 text-muted-foreground transition-colors",
            canManage
              ? "cursor-grab active:cursor-grabbing hover:text-foreground"
              : "cursor-not-allowed opacity-50"
          )}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Status Checkbox */}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={canManage ? handleStatusToggle : undefined}
          disabled={!canManage}
          className="flex-shrink-0"
        />

        {/* Priority Indicator */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-6">
            #{task.priority}
          </span>
          <div
            className={cn("w-2 h-2 rounded-full", priorityColors[task.priorityLevel])}
            title={priorityLabels[task.priorityLevel]}
          />
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className="w-full px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add description..."
                className="w-full px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <p
                  onClick={onClick}
                  className={cn(
                    "font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors",
                    isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {task.name}
                </p>
                {task.status === "in_progress" && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-warning/20 text-warning rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  Updated {formatDate(task.updatedAt)}
                </p>
                {task.dueDate && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isOverdue ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Due {formatDueDate(task.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expand Button */}
        {!isEditing && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Actions */}
        {!isEditing && canManage && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              title="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && !isEditing && (
        <div className="mt-3 pt-3 border-t border-border/50 pl-14 animate-fade-in">
          <div className="space-y-3">
            {task.description ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description</p>
            )}

            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                  disabled={!canManage}
                  className="text-sm bg-background border border-input rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Priority</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-md",
                    task.priorityLevel === "high" && "bg-priority-high/20 text-priority-high",
                    task.priorityLevel === "medium" &&
                      "bg-priority-medium/20 text-priority-medium",
                    task.priorityLevel === "low" && "bg-priority-low/20 text-priority-low"
                  )}
                >
                  <div
                    className={cn("w-2 h-2 rounded-full", priorityColors[task.priorityLevel])}
                  />
                  {priorityLabels[task.priorityLevel]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
