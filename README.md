# TaskFlow

TaskFlow is a collaborative task management app built with React, TypeScript, Express, and MySQL. It has been migrated into a TypeScript + SQL application with realtime notifications, activity feeds, and role-based collaboration.

## Why This Project Is Strong

- Multi-user collaboration with `owner`, `admin`, `editor`, and `viewer` roles
- Realtime notification updates with Server-Sent Events
- Realtime project activity feed
- SQL-backed audit trail and notifications
- Permission-aware frontend and backend authorization
- Backend test coverage for role and query parsing logic

## Architecture

```text
React + Vite frontend
  |
  | HTTP + SSE
  v
Express + TypeScript API
  |
  | SQL
  v
MySQL / MariaDB
```

### Request Flow

1. The React frontend calls REST endpoints for auth, projects, tasks, notifications, and collaboration.
2. The Express backend validates JWT auth and enforces project-role permissions.
3. Data is persisted in MySQL tables for users, projects, project members, tasks, notifications, and activity logs.
4. Live updates are pushed back to the browser with Server-Sent Events for:
   - notification updates
   - activity feed updates

### Key Tables

- `users`
- `projects`
- `project_members`
- `tasks`
- `notifications`
- `activity_logs`

### Permission Model

- Backend is the source of truth for authorization.
- Frontend reads role metadata and hides or disables edit controls for view-only users.
- Task mutations require at least `editor`.
- Member management and project settings require at least `admin`.
- Project deletion remains owner-only.

## Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- Express
- TypeScript
- MySQL / MariaDB
- JWT authentication
- Server-Sent Events for live updates

## Core Features

- Authentication with signup/login
- Project creation and management
- Task create/edit/delete/reorder
- Realtime bell notifications
- Browser notification permission support
- Project activity timeline
- Invite collaborators by email
- Role-based access control

## Roles

- `owner`: full control
- `admin`: manage members and edit project settings
- `editor`: manage tasks
- `viewer`: read-only access

## Local Setup

### 1. Frontend

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:8080` and proxies `/api/*` to the backend.

### 2. Backend

```bash
cd backend
npm install
npm run db:init
npm run db:seed
npm run dev
```

The backend runs on `http://localhost:4000`.

## Docker Setup

If you prefer Docker, an optional containerized setup is available.

```bash
docker compose up --build
```

This starts:

- frontend on `http://localhost:8080`
- backend on `http://localhost:4000`
- MariaDB on host port `3307`

Notes:

- the backend container runs `db:init` and `db:seed` on startup
- the default non-Docker setup still works and is fully supported
- the Vite proxy automatically points to the backend container in Docker

## Environment

Backend env file: [backend/.env](C:\xampp\htdocs\mlh_task\backend\.env)

Expected variables:

- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `JWT_SECRET`
- `PORT`

## Demo Accounts

After running `npm run db:seed` in `backend/`, you can sign in with:

- `owner@taskflow.demo` / `password123`
- `admin@taskflow.demo` / `password123`
- `editor@taskflow.demo` / `password123`
- `viewer@taskflow.demo` / `password123`

## Realtime Features

- Notifications update live through SSE at `/api/notifications/stream`
- Activity feed updates live through SSE at `/api/projects/:id/activity/stream`
- Polling remains as a fallback for notifications

## Reviewer Demo Guide

If you want to review the project quickly, this is the best path:

1. Sign in as `owner@taskflow.demo`
2. Open `MLH Fellowship Launch`
3. Open the activity sidebar and notification bell
4. In a second browser profile, sign in as `editor@taskflow.demo` or `viewer@taskflow.demo`
5. Create or update a task as an editor-capable user
6. Confirm:
   - notifications update live
   - activity feed updates live
   - role restrictions are enforced
   - viewers cannot edit tasks

### Suggested Role Checks

- `owner@taskflow.demo` can invite/remove members
- `admin@taskflow.demo` can manage members and edit project settings
- `editor@taskflow.demo` can manage tasks but should not control ownership
- `viewer@taskflow.demo` can browse but not mutate

## Demo Script

A ready-to-use walkthrough script is available in [DEMO_SCRIPT.md](C:\xampp\htdocs\mlh_task\DEMO_SCRIPT.md).

## Testing

Backend tests:

```bash
cd backend
npm test
```

Current backend coverage includes:

- role hierarchy checks
- permission gating logic
- query parsing edge cases

## Project Structure

```text
mlh_task/
  src/                  Frontend app
  public/               Static assets and service worker
  backend/
    src/                Express API
    scripts/            Database init and demo seed scripts
    tests/              Backend test runner
```

## Suggested Reviewer Flow

1. Sign in as `owner@taskflow.demo`
2. Open the seeded `MLH Fellowship Launch` project
3. Create or update a task
4. Open the activity feed and notification bell
5. Sign in as another seeded user in a second browser profile
6. Confirm shared notifications, activity updates, and role-aware UI

## Notes

- For the best experience, run the frontend with Vite and the backend on port `4000`.
