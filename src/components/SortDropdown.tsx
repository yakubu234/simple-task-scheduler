import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortField = "priority" | "dueDate" | "createdAt" | "name";
export type SortDirection = "asc" | "desc";

interface SortDropdownProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "dueDate", label: "Due Date" },
  { value: "createdAt", label: "Created" },
  { value: "name", label: "Name" },
];

export function SortDropdown({ sortField, sortDirection, onSortChange }: SortDropdownProps) {
  const toggleDirection = () => {
    onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex items-center gap-1">
      <Select
        value={sortField}
        onValueChange={(value: SortField) => onSortChange(value, sortDirection)}
      >
        <SelectTrigger className="w-[130px] h-9 text-sm">
          <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={toggleDirection}
        className="p-2 hover:bg-accent rounded-md transition-colors"
        title={sortDirection === "asc" ? "Ascending" : "Descending"}
      >
        {sortDirection === "asc" ? (
          <ArrowUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
