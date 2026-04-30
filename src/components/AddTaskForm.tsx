import { useState, useEffect } from "react";
import { Priority, TaskStatus } from "@/types/database";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddTaskFormProps {
  onAdd: (name: string, priorityLevel: Priority, description?: string, dueDate?: Date, status?: TaskStatus) => void;
  forceExpanded?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "bg-priority-high" },
  { value: "medium", label: "Medium", color: "bg-priority-medium" },
  { value: "low", label: "Low", color: "bg-priority-low" },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function AddTaskForm({
  onAdd,
  forceExpanded = false,
  disabled = false,
  disabledMessage = "You do not have permission to add tasks here.",
}: AddTaskFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priorityLevel, setPriorityLevel] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle force expand from keyboard shortcut
  useEffect(() => {
    if (forceExpanded && !disabled) {
      setIsExpanded(true);
    }
  }, [forceExpanded, disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), priorityLevel, description.trim() || undefined, dueDate, status);
      setName("");
      setDescription("");
      setPriorityLevel("medium");
      setStatus("todo");
      setDueDate(undefined);
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setName("");
    setDescription("");
    setDueDate(undefined);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => !disabled && setIsExpanded(true)}
        disabled={disabled}
        title={disabled ? disabledMessage : "Add new task"}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 border border-dashed border-border rounded-lg transition-colors",
          disabled
            ? "text-muted-foreground/70 bg-muted/30 cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">
          {disabled ? disabledMessage : "Add new task"}
        </span>
        <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono text-muted-foreground">N</kbd>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-4 animate-scale-in">
      <div className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium text-foreground mb-1.5">
            Task name
          </label>
          <input
            id="taskName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter task name..."
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="taskDescription" className="block text-sm font-medium text-foreground mb-1.5">
            Description (optional)
          </label>
          <Textarea
            id="taskDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add task description..."
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Due date (optional)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Priority level
          </label>
          <div className="flex gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriorityLevel(option.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all",
                  priorityLevel === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", option.color)} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
            <kbd className="ml-2 px-1 py-0.5 bg-secondary-foreground/10 rounded text-[10px] font-mono">Esc</kbd>
          </button>
        </div>
      </div>
    </form>
  );
}
