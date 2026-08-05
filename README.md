<div align="center">

# 🏢 WorkNest Client

### Modern Multi-Tenant ERP Frontend for SaaS Companies

A production-ready enterprise workspace built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, designed for modern organizations that require scalable multi-tenant architecture, role-based access control, realtime collaboration, and a beautiful user experience.

<p align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript"/>
<img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite"/>
<img src="https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss"/>
<img src="https://img.shields.io/badge/Zustand-State-000000?style=for-the-badge"/>
<img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge"/>
<img src="https://img.shields.io/badge/WebSocket-STOMP-success?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker"/>
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge"/>

</p>

---

### 🚀 One Frontend. Unlimited Companies.

WorkNest Client provides a complete SaaS workspace where every organization operates securely within its own isolated tenant while sharing a single application instance.

Designed with enterprise scalability, modern UI/UX, and clean architecture principles.

</div>

---

# ✨ Overview

WorkNest Client is the frontend application of the **WorkNest Multi-Tenant ERP Platform**.

It delivers a modern workspace where employees, managers, HR teams, tenant administrators, and platform administrators collaborate through a single application while maintaining complete tenant isolation.

Unlike traditional ERP systems that require individual deployments per organization, WorkNest follows a **Software-as-a-Service (SaaS)** architecture where multiple organizations securely share one platform without exposing each other's data.

The frontend communicates with the Spring Boot backend through secure REST APIs and WebSocket connections, providing real-time collaboration, authentication, analytics, notifications, and business operations.

---

# 🌟 Why WorkNest?

Modern businesses require far more than simple employee management.

WorkNest combines all essential workplace operations into one integrated platform.

✔ Employee Management

✔ Team Collaboration

✔ Project Management

✔ Task Boards

✔ Attendance Tracking

✔ Leave Management

✔ HR Operations

✔ Internal Announcements

✔ Real-time Notifications

✔ Team Chat

✔ Analytics & Reports

✔ Multi-Tenant Administration

All while maintaining enterprise-grade security and tenant isolation.

---

# 📸 Screenshots

> **Coming Soon**

The following screenshots will be added to demonstrate the application's interface.

```
docs/
└── screenshots/
    ├── dashboard.png
    ├── employees.png
    ├── projects.png
    ├── kanban.png
    ├── announcements.png
    ├── notifications.png
    ├── analytics.png
    ├── reports.png
    ├── chat.png
    ├── profile.png
    ├── settings.png
    └── mobile.png
```

---

# 🎯 Key Features

## 👥 Employee Management

Manage the complete employee lifecycle from onboarding to profile management.

- Employee Directory
- Departments
- Designations
- Employment Status
- Profile Management
- Avatar Uploads
- Contact Information

---

## 📁 Project Management

Manage projects from planning to completion.

- Create Projects
- Assign Members
- Progress Tracking
- Deadlines
- Status Management
- Attachments
- Project Analytics

---

## ✅ Kanban Task Management

Modern drag-and-drop task boards.

Features include:

- Backlog
- Todo
- In Progress
- Review
- Testing
- Done

Each task supports

- Priority
- Assignee
- Due Dates
- Attachments
- Comments
- Activity Timeline

---

## 💬 Realtime Chat

Built-in messaging system.

Supports

- Team Conversations
- Direct Messaging
- Live Delivery
- Typing Indicators
- Read Status
- File Sharing (roadmap)

Powered by STOMP over WebSocket.

---

## 🔔 Notifications

Receive instant updates for

- Task Assignments
- Leave Requests
- Announcements
- Team Updates
- Project Changes
- Chat Messages
- System Events

---

## 📢 Announcements

Organization-wide communication.

Supports

- Rich Content
- Pinning
- Scheduling (roadmap)
- Permission-based Editing
- Company Visibility

---

## 📊 Analytics

Interactive dashboards including

- Employee Statistics
- Attendance Trends
- Leave Analytics
- Project Progress
- Task Completion
- Organization KPIs

---

## 🏢 Multi-Tenant SaaS

Every company operates independently.

Each tenant has

- Users
- Employees
- Teams
- Projects
- Tasks
- Notifications
- Storage
- Reports

All isolated from every other organization.

---

# 🛠 Technology Stack

| Layer | Technology |
|---------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| HTTP Client | Axios |
| Icons | Lucide React |
| Forms | React Hook Form |
| Validation | Zod |
| Realtime | STOMP over WebSocket |
| Charts | Recharts |
| File Upload | Multipart Uploads |
| Authentication | JWT |
| Storage | Supabase (Backend Managed) |
| Deployment | Docker + Nginx + Dokploy |
| Testing | Vitest + Testing Library |

---

# 🏗 System Architecture

```text
                   Browser
                       │
                       │
                       ▼
             React + TypeScript
                       │
                       │
              React Router + Layouts
                       │
                       ▼
          TanStack Query + Zustand
                       │
                       ▼
                 Axios Client
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
 REST API Requests            WebSocket (STOMP)
        │                             │
        └──────────────┬──────────────┘
                       ▼
             Spring Boot Backend
                       │
                       ▼
              Multi-Tenant MySQL
                       │
                       ▼
            Supabase Object Storage
```

---

# 🎨 Design Philosophy

WorkNest follows several core UI principles.

### Modern

A clean interface inspired by today's leading SaaS platforms.

---

### Fast

Lazy-loaded pages and optimized rendering ensure excellent performance.

---

### Consistent

Shared design tokens maintain consistency across every module.

---

### Responsive

Designed for desktops, tablets, and mobile devices.

---

### Accessible

Keyboard navigation, semantic HTML, and accessible components are used wherever possible.

---

# 🚀 Core Modules

| Module | Status |
|----------|--------|
| Dashboard | ✅ |
| Authentication | ✅ |
| Employees | ✅ |
| Teams | ✅ |
| Projects | ✅ |
| Tasks | ✅ |
| Attendance | ✅ |
| Leave | ✅ |
| Chat | ✅ |
| Notifications | ✅ |
| Announcements | ✅ |
| Reports | ✅ |
| Analytics | ✅ |
| Settings | ✅ |
| Platform Console | ✅ |

---

# 📦 Repository

```text
WorkNest-Client
│
├── React 19
├── TypeScript
├── Vite
├── Tailwind CSS
├── Zustand
├── TanStack Query
├── STOMP WebSocket
└── Docker Ready
```

---

# 📂 Project Structure

WorkNest follows a feature-first architecture that separates business domains from shared infrastructure. Each module owns its own components, pages, services, hooks, and types, making the codebase scalable and easier to maintain.

```text
src
│
├── app/
│   ├── layouts/
│   ├── providers/
│   ├── router/
│   ├── guards/
│   └── App.tsx
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── illustrations/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── ui/
│   ├── forms/
│   ├── feedback/
│   └── navigation/
│
├── hooks/
│
├── modules/
│   ├── analytics/
│   ├── announcements/
│   ├── attendance/
│   ├── auth/
│   ├── chat/
│   ├── dashboard/
│   ├── employees/
│   ├── leave/
│   ├── notifications/
│   ├── platform/
│   ├── profile/
│   ├── projects/
│   ├── reports/
│   ├── settings/
│   ├── tasks/
│   └── teams/
│
├── services/
│   ├── api/
│   ├── auth/
│   ├── realtime/
│   ├── uploads/
│   └── storage/
│
├── store/
│
├── styles/
│
├── types/
│
├── utils/
│
└── main.tsx
```

---

# 🏛 Architecture Overview

The client follows a layered architecture to separate presentation, business logic, infrastructure, and shared utilities.

```text
┌─────────────────────────────┐
│        React Pages          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│    Feature Components       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│     Custom Hooks            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Feature Services / Queries  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Axios API Client            │
└─────────────┬───────────────┘
              │
              ▼
       Spring Boot Backend
```

Each layer has a single responsibility and communicates only with the layer directly below it.

---

# 🧩 Module-Based Development

Instead of grouping files by type, WorkNest groups them by business domain.

Example:

```text
modules/
└── employees/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── services/
    ├── types/
    ├── utils/
    └── index.ts
```

Benefits:

- High cohesion
- Better scalability
- Easier onboarding
- Independent feature evolution
- Reduced coupling

---

# 🔐 Authentication

Authentication is handled using JWT access and refresh tokens.

## Login Flow

```text
User
 │
 │ Login
 ▼
React Form
 │
 ▼
Axios Client
 │
 ▼
Spring Boot API
 │
 ▼
Validate Credentials
 │
 ▼
Access Token
Refresh Token
User Details
 │
 ▼
Frontend Session
```

After authentication:

- User profile is loaded
- Permissions are resolved
- Tenant information is initialized
- Navigation is generated dynamically

---

# 🔄 Session Lifecycle

```text
Application Starts
        │
        ▼
Check Existing Session
        │
        ▼
Access Token Valid?
     │         │
     │         │
    Yes       No
     │         │
     │         ▼
     │   Refresh Token
     │         │
     │         ▼
     │  New Access Token
     │
     ▼
Continue Application
```

If refresh fails:

```text
Clear Session
        │
        ▼
Redirect Login
```

---

# 🛡 Authorization

WorkNest uses **Permission-Based Authorization** instead of relying only on user roles.

Every page, button, menu item, API request, and action is validated against permissions.

```text
User
 │
 ▼
Permissions
 │
 ▼
PermissionGuard
 │
 ▼
Page Visible?
 │
 ├── Yes
 │
 └── No
        │
        ▼
Unauthorized Screen
```

---

# 👥 Supported Roles

| Role | Description |
|------|-------------|
| PLATFORM_ADMIN | Platform management |
| TENANT_ADMIN | Company administration |
| HR | Human resource operations |
| MANAGER | Team management |
| EMPLOYEE | Daily workspace access |

---

# 🔑 Permission System

Permissions are more granular than roles.

Examples include:

- Employee.Read
- Employee.Create
- Employee.Update
- Employee.Delete

- Project.Read
- Project.Manage

- Announcement.Manage

- Team.Manage

- Attendance.View

This enables flexible tenant-specific access policies.

---

# 🏢 Multi-Tenant Architecture

WorkNest is built around complete tenant isolation.

```text
                    WorkNest Platform
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
     Company A         Company B         Company C
        │                  │                  │
 Employees          Employees         Employees
 Projects           Projects          Projects
 Tasks              Tasks             Tasks
 Chat               Chat              Chat
 Reports            Reports           Reports
```

Each tenant operates independently while sharing the same frontend application.

---

# 🧭 Routing Architecture

The application is divided into three major route groups.

```text
/
│
├── Public
│
├── Authentication
│
├── Tenant Workspace
│
└── Platform Console
```

Example:

```text
/

/login

/register

/reset-password

/app/dashboard

/app/employees

/app/projects

/app/tasks

/app/chat

/app/reports

/platform/dashboard

/platform/tenants

/platform/users
```

---

# 🚪 Route Guards

Routes are protected using dedicated guard components.

```text
Request Route
      │
      ▼
Authentication Guard
      │
      ▼
Permission Guard
      │
      ▼
Tenant Guard
      │
      ▼
Page
```

This prevents unauthorized content from rendering.

---

# 🌐 API Communication

All backend communication passes through a centralized Axios client.

Responsibilities include:

- Base URL configuration
- JWT injection
- Tenant header injection
- Automatic token refresh
- Error normalization
- Request retries
- File uploads
- Download helpers

---

# 🔄 API Flow

```text
React Component
       │
       ▼
Feature Service
       │
       ▼
Axios Instance
       │
       ▼
Request Interceptors
       │
       ▼
Spring Boot API
       │
       ▼
Response Interceptors
       │
       ▼
TanStack Query
       │
       ▼
React UI
```

---

# 📦 State Management

WorkNest uses **Zustand** for lightweight global state.

Examples include:

- Authentication
- Current User
- Active Tenant
- Theme
- Notifications
- Sidebar State
- Preferences

Feature-specific server state is managed with **TanStack Query**, keeping API data synchronized with the backend.

---

# ⚡ Data Fetching

TanStack Query provides:

- Automatic caching
- Background refetching
- Loading states
- Error handling
- Request deduplication
- Optimistic updates (where applicable)
- Mutation management

This significantly reduces boilerplate while improving responsiveness.

---

# 🧠 Custom Hooks

The application exposes reusable hooks for common functionality.

Examples include:

```text
useAuth()

useCurrentUser()

usePermission()

useTheme()

useNotifications()

useRealtime()

useDebounce()

usePagination()

usePageTitle()
```

These hooks encapsulate reusable logic and keep components focused on rendering.

---

# 📚 Design Principles

WorkNest follows these engineering principles throughout the frontend:

- Feature-first architecture
- Separation of concerns
- Composition over inheritance
- Reusable UI primitives
- Strong typing with TypeScript
- Centralized API communication
- Predictable state management
- Lazy-loaded modules
- Permission-driven rendering
- Clean and maintainable codebase

---

# ⚡ Realtime Architecture

WorkNest provides a realtime experience for collaboration, communication, and operational awareness.

The frontend communicates with the backend using **native WebSockets** with the **STOMP protocol**, allowing instant updates without polling.

Current realtime features include:

- 💬 Team Chat
- 🔔 Live Notifications
- 📢 Announcement Events
- 📋 Task Updates
- 👥 Presence (Roadmap)
- ✍️ Typing Indicators (Roadmap)
- 📁 Live File Events (Roadmap)

---

# 🛰 Realtime Architecture

```text
                     Browser
                        │
                        ▼
              STOMP Client Service
                        │
                        ▼
                Native WebSocket
                        │
                        ▼
               Spring Boot Backend
                        │
              Simple Message Broker
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   Notifications      Chat          Task Events
```

The client maintains a single WebSocket connection and subscribes to multiple STOMP destinations depending on the authenticated user and active tenant.

---

# 💬 Chat System

The chat module enables real-time communication between team members.

Current capabilities include:

- Team conversations
- Direct messaging
- Live message delivery
- Automatic reconnection
- Message history
- Read status
- Attachment-ready architecture

Future enhancements:

- Voice messages
- Emoji reactions
- Message editing
- Message deletion synchronization
- Online presence
- Typing indicators
- File previews

---

## Chat Flow

```text
User Types Message
        │
        ▼
React Component
        │
        ▼
Chat Service
        │
        ▼
STOMP SEND
        │
        ▼
Spring Boot
        │
        ▼
Broker
        │
        ▼
Subscribed Clients
        │
        ▼
React UI Updates
```

---

# 🔔 Notification System

Notifications are system-generated events triggered by backend business logic.

Examples:

- New task assigned
- Leave approved
- Leave rejected
- Announcement published
- Project updated
- Team invitation
- Password changed
- Employee onboarded

Notifications are delivered instantly over WebSocket and displayed within the application's notification center.

---

## Notification Flow

```text
Backend Event
      │
      ▼
Notification Service
      │
      ▼
STOMP Topic
      │
      ▼
Frontend Subscription
      │
      ▼
Notification Store
      │
      ▼
Notification Center
```

---

# 📁 File Upload System

WorkNest follows a backend-mediated upload architecture.

The browser never communicates directly with object storage.

Instead, uploads flow through the backend to ensure validation, authorization, and centralized storage management.

---

## Upload Architecture

```text
User
 │
 ▼
Choose File
 │
 ▼
React Upload Component
 │
 ▼
Axios Multipart Request
 │
 ▼
Spring Boot Upload API
 │
 ▼
Supabase Storage
 │
 ▼
Metadata Returned
 │
 ▼
Database Record Updated
```

---

Supported upload types include:

- Profile images
- Leave documents
- Project attachments
- Task attachments
- Organization logos
- Future media uploads

---

# 🪣 Storage Integration

The frontend is storage-provider agnostic.

It never embeds storage credentials or bucket logic.

Instead, it consumes URLs returned by the backend.

Benefits:

- Storage provider can change without frontend changes
- Better security
- Consistent upload validation
- Centralized access control
- Simplified browser code

Current production target:

- Supabase Storage

Future supported providers:

- Amazon S3
- Cloudflare R2
- MinIO
- Azure Blob Storage

---

# 🌐 Environment Configuration

WorkNest uses Vite environment variables for runtime configuration.

Example:

```env
VITE_API_BASE_URL=http://localhost:8080

VITE_WS_URL=ws://localhost:8080/ws

VITE_REALTIME_DISABLED=false

VITE_CHAT_TOPICS=/topic/chat.global,/user/queue/chat

VITE_NOTIFICATIONS_TOPICS=/topic/notifications.global,/user/queue/notifications
```

---

## Production Example

```env
VITE_API_BASE_URL=https://api.worknest.example

VITE_WS_URL=wss://api.worknest.example/ws

VITE_REALTIME_DISABLED=false
```

Never expose secrets inside VITE_* variables.

The frontend should never contain:

- Database passwords
- JWT signing keys
- SMTP credentials
- Service-role keys
- Cloud provider secrets

---

# ⚙ Runtime Configuration

The frontend supports runtime configuration without rebuilding Docker images.

Configuration values are injected through a generated runtime configuration file, allowing deployments to update API endpoints and related settings without creating a new frontend build.

Typical runtime settings include:

- API Base URL
- WebSocket URL
- Feature Flags
- Environment Name

---

# 🐳 Docker Support

The frontend is fully containerized.

Production image stack:

```text
Node.js
     │
npm build
     │
Vite Production Build
     │
Static Assets
     │
Nginx
```

---

## Docker Architecture

```text
Docker Build
      │
      ▼
Node Builder Stage
      │
      ▼
npm install
      │
      ▼
npm run build
      │
      ▼
dist/
      │
      ▼
Nginx Runtime Image
```

Benefits:

- Small production image
- Fast startup
- Static asset serving
- Efficient caching
- Easy deployment

---

# 🖥 Local Development

## Install dependencies

```bash
npm install
```

---

## Start development server

```bash
npm run dev
```

Default development server:

```text
http://localhost:5173
```

---

## Production build

```bash
npm run build
```

---

## Preview production build

```bash
npm run preview
```

---

## Lint

```bash
npm run lint
```

---

## Run Tests

```bash
npm test
```

or

```bash
npm run test:run
```

---

# 📦 Build Pipeline

```text
Git Pull
    │
    ▼
npm install
    │
    ▼
TypeScript Compile
    │
    ▼
Vite Production Build
    │
    ▼
Static Assets Generated
    │
    ▼
Docker Image
    │
    ▼
Nginx
```

---

# 🚀 Deployment Targets

The frontend has been designed to deploy consistently across multiple platforms.

Supported deployment targets include:

| Platform | Status |
|----------|--------|
| Docker | ✅ |
| Dokploy | ✅ |
| Nginx | ✅ |
| Vercel | ✅ |
| Netlify | ✅ |
| Azure Static Web Apps | ✅ |
| GitHub Pages *(static only)* | ✅ |

---

# 🔧 Recommended Development Tools

For the best development experience, the following tools are recommended:

| Tool | Purpose |
|------|----------|
| Visual Studio Code | Editor |
| Node.js 20+ | Runtime |
| npm | Package Manager |
| Docker Desktop | Containers |
| Postman | API Testing |
| Chrome DevTools | Debugging |
| React Developer Tools | Component Inspection |

---

# 📈 Development Workflow

```text
Feature Branch
      │
      ▼
Development
      │
      ▼
Code Review
      │
      ▼
Testing
      │
      ▼
Production Build
      │
      ▼
Docker Image
      │
      ▼
Dokploy Deployment
```

---

# 💡 Engineering Goals

The frontend is designed around the following engineering principles:

- Clean Architecture
- Component Reusability
- Feature Isolation
- Strong Type Safety
- Responsive UI
- Accessibility
- Maintainability
- Scalability
- Performance
- Enterprise Readiness

---

