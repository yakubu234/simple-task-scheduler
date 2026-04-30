import { useState } from "react";
import { TaskStatus, ProjectUI } from "@/types/database";
import { ProjectSelector } from "./ProjectSelector";
import { StatusFilter } from "./StatusFilter";
import { SearchBar } from "./SearchBar";
import { SortDropdown, SortField, SortDirection } from "./SortDropdown";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { NotificationBell } from "./NotificationBell";
import { UserSettingsDialog } from "./UserSettingsDialog";
import { ActivitySidebar } from "./ActivitySidebar";
import { CollaborationDialog } from "./CollaborationDialog";
import { ProjectRoleBadge } from "./ProjectRoleBadge";
import { useAuth } from "@/contexts/AuthContext";
import { CheckSquare, Settings, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { forwardRef } from "react";

interface HeaderProps {
  projects: ProjectUI[];
  selectedProject: string;
  onSelectProject: (projectId: string) => void;
  onAddProject: (name: string) => void;
  taskCount: number;
  selectedStatus: TaskStatus | "all";
  onStatusChange: (status: TaskStatus | "all") => void;
  statusCounts: {
    all: number;
    todo: number;
    in_progress: number;
    completed: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export const Header = forwardRef<HTMLInputElement, HeaderProps>(({
  projects,
  selectedProject,
  onSelectProject,
  onAddProject,
  taskCount,
  selectedStatus,
  onStatusChange,
  statusCounts,
  searchQuery,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
}, ref) => {
  const { user, profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const currentProject = projects.find((p) => p.id === selectedProject);

  const initials = (profile?.display_name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">TaskFlow</h1>
                  {currentProject && selectedProject !== "all" && (
                    <ProjectRoleBadge role={currentProject.currentRole} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {taskCount} {taskCount === 1 ? "task" : "tasks"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <KeyboardShortcutsHelp />

              {selectedProject !== "all" && currentProject && (
                <ActivitySidebar projectId={currentProject.id} projectName={currentProject.name} />
              )}

              {selectedProject !== "all" && currentProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCollaboration(true)}
                  title="Collaborate"
                >
                  <Users className="h-5 w-5" />
                </Button>
              )}

              {/* Notification bell */}
              <NotificationBell />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.display_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onSelect={onSelectProject}
                onAddProject={onAddProject}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <SearchBar
                ref={ref}
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search tasks... (press /)"
              />
            </div>
            <SortDropdown
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
          </div>

          <StatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={onStatusChange}
            counts={statusCounts}
          />
        </div>
      </header>

      {/* Dialogs */}
      <UserSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      {selectedProject !== "all" && currentProject && (
        <CollaborationDialog
          open={showCollaboration}
          onOpenChange={setShowCollaboration}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}
    </>
  );
});

Header.displayName = "Header";
