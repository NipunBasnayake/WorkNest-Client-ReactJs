# WorkNest Client

WorkNest is a production-grade, multi-tenant ERP frontend built with React, Vite, TypeScript, and Tailwind CSS. It provides the tenant workspace for day-to-day operations and a separate platform console for internal administration.

The application is designed for SaaS teams that need a single frontend for employees, managers, HR, and tenant administrators without leaking platform-level capabilities into the tenant experience.

## 1. Project Overview

WorkNest solves the problem of fragmented workplace operations by combining core business workflows into one tenant-aware interface.

Each company is isolated as a tenant. The frontend communicates with tenant-scoped APIs, renders features according to the active user permissions, and keeps platform administration separate from tenant usage.

The current client covers authentication, dashboards, employees, teams, projects, tasks, attendance, leave, announcements, notifications, chat, analytics, and settings.

## 2. Features

- Tenant-aware authentication and session bootstrap
- Permission-based route guards and UI rendering
- Employee, team, project, and task management
- Attendance and leave workflows
- Announcements with pinned content and CRUD support
- System notifications shown in the topbar
- Team and HR chat messaging
- Dashboard and analytics views
- File uploads for profile images, task attachments, leave documents, and project files
- Separate public, tenant, and platform route shells

## 3. Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | React 19, Vite |
| Language | TypeScript |
| Routing | React Router |
| Data Fetching | TanStack Query |
| HTTP | Axios |
| Styling | Tailwind CSS v4, token-driven CSS variables |
| State | Zustand |
| Realtime | STOMP over WebSocket |
| Storage | Supabase-backed file storage contract |
| Icons | Lucide React |
| Testing | Vitest, Testing Library, jsdom |

## 4. Project Structure

### `src/app`

Application composition lives here: providers, layouts, route guards, and the router entry point. This is where the app shell is assembled and where tenant, platform, and public boundaries are enforced.

### `src/modules`

Feature logic is grouped by domain. Each module owns its types, services, access rules, components, and page-level workflows. This keeps announcements, chat, tasks, leave, and other business domains isolated from each other.

### `src/components`

Shared UI components live here. These are reusable primitives and composite components used across modules, such as buttons, dialogs, inputs, headers, nav surfaces, and section cards.

### `src/services`

Infrastructure code lives here: HTTP clients, response parsers, auth/token handling, realtime subscriptions, and file upload helpers. Shared API concerns are centralized so modules stay focused on business behavior.

### `src/hooks`

Reusable hooks expose cross-cutting behavior such as auth state, permissions, theme, page metadata, toast state, and queries.

## 5. Authentication & Authorization

WorkNest uses JWT-based authentication with access and refresh token handling. The frontend boots the session on load, restores the authenticated user when tokens are available, and refreshes expired access tokens through the shared Axios client.

The current client persists session state client-side and sends bearer tokens on API requests. The auth layer is structured so it can evolve toward HttpOnly cookie refresh handling when the backend contract is finalized.

Authorization is permission-based, not role-only.

- `PLATFORM_ADMIN` belongs to the platform console, not the tenant workspace
- `TENANT_ADMIN` can manage tenant-wide workspace content and admin workflows
- `HR` can manage HR-related areas such as announcements and people workflows where permitted
- `EMPLOYEE` receives only the permissions granted by the tenant policy

The UI checks permissions through the `usePermission` hook, and protected routes use `PermissionGuard` to block access before the page renders. This same model is used for module entry points and management flows.

For announcements, the backend also returns item-level flags such as `canEdit` and `canDelete`, allowing the UI to render action controls only when the current user is allowed to act on a specific record.

API communication is handled by a shared Axios client that:

- Sets the API base URL from environment configuration
- Attaches the bearer access token automatically
- Adds tenant-scoped headers for tenant endpoints
- Retries failed requests after token refresh
- Normalizes API errors into user-friendly messages

## 6. Announcements System

Announcements are workspace content, not system alerts.

They are authored by authorized tenant users, currently TENANT_ADMIN and HR, and are visible in `/app/announcements`. Announcements support a title, rich text content, pinned status, and record-level actions such as edit and delete when the backend allows them.

Notifications are different.

- Announcements are deliberate content created by users with permission
- Notifications are system-generated events tied to entities such as tasks, leave requests, or announcements
- Announcements appear as browsable content in the announcements module
- Notifications appear in the topbar and notification center as operational updates

The routing model reflects that split:

- `/app/announcements` for the announcements list
- `/app/announcements/new` for creation
- `/app/announcements/:id` for details
- `/app/announcements/:id/edit` for editing

Management routes are protected by announcement management guards, and the card component renders edit/delete controls inline when the current announcement can be modified.

## 7. File Uploads (Supabase)

WorkNest supports file uploads for profile images, task attachments, leave documents, and project files.

The frontend upload flow is multipart-based:

1. The UI collects a file from the user
2. The upload service validates type and size on the client
3. The file is sent to the backend upload endpoint as `multipart/form-data`
4. The backend persists the file in storage, typically Supabase Storage in production
5. The backend returns a public or resolved URL plus metadata
6. The frontend stores that returned URL in the relevant domain record

This keeps the browser free from storage secrets and lets the backend control bucket structure, access rules, and URL normalization.

Example usage:

```ts
import { uploadImageFiles, uploadDocumentFiles } from "@/services/uploads/fileUploadService";

const images = await uploadImageFiles(files, { folder: "profiles" });
const documents = await uploadDocumentFiles(files, { folder: "leave-documents" });
```

Recommended environment variables for storage integration:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

If your deployment uses backend-mediated uploads only, these values can remain unused by the browser bundle, but they are still useful to document the storage contract and deployment environment.

## 8. Environment Variables

Create a local environment file at the project root.

```bash
.env.local
```

Required variables:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Storage-related variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional realtime variables:

```env
VITE_WS_URL=ws://localhost:8080/ws
VITE_REALTIME_DISABLED=false
VITE_CHAT_TOPICS=/topic/chat.global,/user/queue/chat
VITE_NOTIFICATIONS_TOPICS=/topic/notifications.global,/user/queue/notifications
```

Notes:

- If `VITE_WS_URL` is not set, the websocket URL can be derived from the API base URL in the realtime layer
- If `VITE_REALTIME_DISABLED` is `true`, STOMP subscriptions stay inactive
- Realtime uses native WebSocket with STOMP. SockJS fallback is intentionally not part of the supported browser contract; all supported browsers provide WebSocket, and avoiding SockJS also avoids its deprecated global `unload` lifecycle listener.
- Topic variables accept comma-separated destination strings

## 9. Running the Project

```bash
npm install
npm run dev
npm run build
```

Useful local checks:

```bash
npm run lint
npm run test:run
```

## 10. Production Notes

- The app uses lazy-loaded routes and manual chunking, which helps keep initial load cost under control
- Watch Vite bundle warnings during builds, especially when shared UI or icon imports expand vendor chunks
- API availability is a hard dependency for authenticated workspace pages, because most modules fetch data from tenant-scoped endpoints
- The Axios client handles token refresh and error normalization centrally, so most modules should not implement their own network retry logic
- File uploads should remain backend-mediated so storage credentials stay out of the browser bundle

## 11. Known Limitations

- Chat delete or removal synchronization is not fully exposed in the current client, so delete-related changes may still require a refresh until realtime coverage is extended
- The browser currently relies on the backend API for uploads rather than talking directly to Supabase from the UI
- Some permission checks are still driven by backend-provided flags on a per-record basis, so UI action visibility depends on API responses

## 12. Future Improvements

- Move refresh handling fully to HttpOnly cookie sessions when the backend contract is ready
- Expand realtime coverage for chat state changes and delete events
- Add optimistic updates where mutation safety is well defined
- Introduce stronger upload metadata validation and file scanning on the backend
- Add more granular analytics caching and prefetching with TanStack Query
- Extend auditability for high-impact tenant actions such as announcements and approvals

## Testing

The project uses Vitest and Testing Library with a jsdom test environment.

```bash
npm run test
npm run test:run
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.
