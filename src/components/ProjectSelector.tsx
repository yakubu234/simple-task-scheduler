import { useState } from "react";
import { ProjectUI } from "@/types/database";
import { ChevronDown, Folder, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectRoleBadge } from "./ProjectRoleBadge";

interface ProjectSelectorProps {
  projects: ProjectUI[];
  selectedProject: string;
  onSelect: (projectId: string) => void;
  onAddProject: (name: string) => void;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onSelect,
  onAddProject,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName("");
      setIsAdding(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors min-w-[220px]"
      >
        <FolderOpen className="w-4 h-4 text-primary" />
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium text-foreground truncate">
            {selectedProjectData?.name || "All Projects"}
          </div>
        </div>
        {selectedProjectData && <ProjectRoleBadge role={selectedProjectData.currentRole} compact />}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 animate-scale-in overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => {
                onSelect("all");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors",
                selectedProject === "all" && "bg-accent"
              )}
            >
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">All Projects</span>
            </button>

            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onSelect(project.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors",
                  selectedProject === project.id && "bg-accent"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="font-medium flex-1 truncate">{project.name}</span>
                <ProjectRoleBadge role={project.currentRole} compact />
              </button>
            ))}

            <div className="border-t border-border mt-1 pt-1">
              {isAdding ? (
                <div className="px-3 py-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddProject();
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewProjectName("");
                      }
                    }}
                    placeholder="Project name..."
                    className="w-full px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleAddProject}
                      className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewProjectName("");
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New project</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
