import { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { Circle, Clock, CheckCircle2 } from "lucide-react";

interface StatusFilterProps {
  selectedStatus: TaskStatus | "all";
  onStatusChange: (status: TaskStatus | "all") => void;
  counts: {
    all: number;
    todo: number;
    in_progress: number;
    completed: number;
  };
}

const statusOptions: {
  value: TaskStatus | "all";
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { 
    value: "all", 
    label: "All", 
    icon: null,
    color: "bg-muted text-muted-foreground hover:bg-muted/80"
  },
  { 
    value: "todo", 
    label: "To Do", 
    icon: <Circle className="w-3.5 h-3.5" />,
    color: "bg-muted text-muted-foreground hover:bg-muted/80"
  },
  { 
    value: "in_progress", 
    label: "In Progress", 
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "bg-warning/20 text-warning hover:bg-warning/30"
  },
  { 
    value: "completed", 
    label: "Completed", 
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "bg-success/20 text-success hover:bg-success/30"
  },
];

export function StatusFilter({ selectedStatus, onStatusChange, counts }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => {
        const count = counts[option.value];
        const isSelected = selectedStatus === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : option.color
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-xs",
              isSelected 
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-background/50"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
