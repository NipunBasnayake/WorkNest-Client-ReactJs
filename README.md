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

