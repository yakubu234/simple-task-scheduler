-- Task Manager Database Schema
-- MySQL 5.7+ / MariaDB 10.2+

-- Create database (run this first if needed)
-- CREATE DATABASE IF NOT EXISTS task_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE task_manager;

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority INT NOT NULL DEFAULT 1,
    priority_level ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('todo', 'in_progress', 'completed') DEFAULT 'todo',
    due_date DATE DEFAULT NULL,
    project_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project_id (project_id),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    
    CONSTRAINT fk_project 
        FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data
-- ============================================

-- Insert sample projects
INSERT INTO projects (name, color) VALUES
    ('Personal', '#3b82f6'),
    ('Work', '#8b5cf6'),
    ('Side Project', '#10b981');

-- Insert sample tasks
INSERT INTO tasks (name, description, priority, priority_level, status, due_date, project_id) VALUES
    ('Design task management UI', 'Create a modern, clean UI for the task management application with drag-and-drop functionality.', 1, 'high', 'in_progress', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 2),
    ('Implement drag and drop', 'Add drag and drop functionality to reorder tasks. Priority should update automatically.', 2, 'high', 'todo', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 2),
    ('Set up MySQL database', 'Configure the MySQL database with proper schema for tasks and projects.', 3, 'medium', 'completed', NULL, 2),
    ('Buy groceries', NULL, 1, 'low', 'todo', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1),
    ('Plan weekend trip', 'Research destinations and book accommodation for the weekend getaway.', 2, 'medium', 'todo', NULL, 1);

-- ============================================
-- Useful Queries for Reference
-- ============================================

-- Get all tasks for a project, ordered by priority
-- SELECT * FROM tasks WHERE project_id = 1 ORDER BY priority ASC;

-- Get task count per project
-- SELECT p.name, COUNT(t.id) as task_count 
-- FROM projects p 
-- LEFT JOIN tasks t ON p.id = t.project_id 
-- GROUP BY p.id;

-- Get overdue tasks
-- SELECT * FROM tasks WHERE due_date < CURDATE() AND status != 'completed';

-- Get tasks by status
-- SELECT * FROM tasks WHERE status = 'todo' ORDER BY priority ASC;
