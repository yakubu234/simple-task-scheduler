import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onNewTask?: () => void;
  onEscape?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onToggleComplete?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Always handle Escape
      if (e.key === "Escape") {
        handlers.onEscape?.();
        return;
      }

      // Don't handle other shortcuts when in input
      if (isInput) return;

      // Ctrl/Cmd + N or just N for new task
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handlers.onNewTask?.();
        return;
      }

      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onNewTask?.();
        return;
      }

      // J/K for navigation
      if (e.key === "j") {
        e.preventDefault();
        handlers.onNavigateDown?.();
        return;
      }

      if (e.key === "k") {
        e.preventDefault();
        handlers.onNavigateUp?.();
        return;
      }

      // Enter or Space to toggle complete
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlers.onToggleComplete?.();
        return;
      }

      // Delete or Backspace to delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handlers.onDelete?.();
        return;
      }

      // / or Ctrl+K for search
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: "N", description: "New task" },
  { key: "J / K", description: "Navigate down / up" },
  { key: "Enter", description: "Toggle complete" },
  { key: "Del", description: "Delete task" },
  { key: "/", description: "Search" },
  { key: "Esc", description: "Cancel / Close" },
];
