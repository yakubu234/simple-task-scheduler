# TaskFlow Backend

Express + TypeScript + MySQL backend for TaskFlow.

## Commands

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

## Useful Scripts

- `npm run dev` — start backend in development
- `npm run build` — compile TypeScript
- `npm run db:init` — create/update database tables
- `npm run db:seed` — add demo users, project, tasks, notifications, and activity
- `npm test` — run backend tests

## API Areas

- `/api/auth`
- `/api/projects`
- `/api/tasks`
- `/api/notifications`

## Realtime Endpoints

- `GET /api/notifications/stream`
- `GET /api/projects/:id/activity/stream`

## Demo Accounts

Created by `npm run db:seed`:

- `owner@taskflow.demo` / `password123`
- `admin@taskflow.demo` / `password123`
- `editor@taskflow.demo` / `password123`
- `viewer@taskflow.demo` / `password123`
