# Demo Script

## Goal

Show that TaskFlow is not just a todo list, but a collaborative engineering project with:

- role-based access control
- realtime notifications
- realtime activity feed
- shared project collaboration
- tested TypeScript + SQL backend

## Demo Length

5 to 7 minutes

## Setup Before Recording

1. Start the backend and frontend
2. Seed demo data
3. Open two browser profiles or one normal window and one incognito window
4. Sign in as:
   - `owner@taskflow.demo` / `password123`
   - `viewer@taskflow.demo` or `editor@taskflow.demo` / `password123`

## Suggested Walkthrough

### 1. Intro

Say:

> TaskFlow is a collaborative task management app rebuilt around a TypeScript backend and MySQL, with realtime notifications, activity tracking, and role-based access control.

### 2. Show the Project

1. Open the seeded `MLH Fellowship Launch` project
2. Point out:
   - task list
   - notification bell
   - activity feed button
   - collaboration button

Say:

> The focus here is not just CRUD. It is multi-user collaboration with clear permissions and live feedback.

### 3. Show Realtime Activity

1. In the owner/editor session, create a task or update a task status
2. Open the activity feed
3. Show the new activity entry appears immediately

Say:

> Project activity is persisted in SQL and streamed to the frontend with Server-Sent Events.

### 4. Show Realtime Notifications

1. In one session, create or update a task
2. In the second session, show the notification bell updating without reload
3. If browser notification permission is enabled, mention popup support

Say:

> Notifications are also live and are delivered to collaborators, not just the acting user.

### 5. Show Collaboration and Roles

1. Open the collaboration dialog as owner
2. Show member roles: owner, admin, editor, viewer
3. Switch to the viewer account and show:
   - they can see the project
   - they cannot add/edit/delete tasks
4. Switch to the editor account and show:
   - they can manage tasks
   - they do not have owner-only powers

Say:

> Permissions are enforced in both the backend and the UI, so the interface reflects what each role is actually allowed to do.

### 6. Mention Testing

Open terminal and run:

```bash
cd backend
npm test
```

Say:

> I also added backend tests around permission hierarchy and task query parsing to reduce regressions in the collaboration layer.

### 7. Close

Say:

> This project demonstrates product thinking, realtime systems, access control, SQL schema design, and maintainable TypeScript code across the stack.

## If You Need a Shorter 2-Minute Version

1. Sign in as owner
2. Open seeded project
3. Create/update a task
4. Show live activity feed
5. Show second user receiving live notification
6. Show viewer cannot edit

## Backup Talking Points

- The app was migrated away from a mixed PHP/Supabase setup
- Realtime is implemented with SSE instead of polling-only behavior
- Collaboration uses explicit project membership and role checks
- Activity logs and notifications are stored in SQL for auditability
