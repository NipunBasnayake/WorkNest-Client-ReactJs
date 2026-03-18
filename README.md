# 🚀 WorkNest Client
**The ultimate enterprise-grade workspace collaboration platform.** Streamline team organization, supercharge project management, and boost employee engagement—all in one place.

---

## 📌 Project Overview
WorkNest is a modern, full-featured employee and project management platform. Built with **React 19**, **TypeScript**, and **Vite**, it delivers a lightning-fast, scalable, and highly interactive user experience.

Whether you are managing daily tasks, tracking attendance, or communicating with your team in real-time, WorkNest provides the modular architecture to handle it all seamlessly.

---

## ✨ What's Inside? (Core Modules)
WorkNest is divided into intuitive, feature-rich modules to keep your workspace organized:

- 🗣️ **Chat**: Real-time messaging powered by WebSocket (STOMP)
- 👥 **Employees**: Comprehensive employee directory and profile management
- 📅 **Attendance & Leave**: Tracking records, leave requests, and approval workflows
- 📊 **Projects & Tasks**: Full project lifecycle tracking with a Kanban-style task board
- 👨‍💼 **Teams**: Easy team creation and cross-functional organization
- 📣 **Announcements**: Company-wide internal communications
- 🔔 **Notifications**: Instant, real-time alert system
- 📈 **Analytics**: Actionable insights and a reporting dashboard
- ⚙️ **Settings**: Highly customizable user preferences and platform configurations

---

## 🛠️ Technology Stack

| Layer              | Technology |
|--------------------|-----------|
| **Frontend Core** | React 19.2, TypeScript 5.9 |
| **Build Tool** | Vite 8 (Tree-shaking & Code Splitting) |
| **Styling** | Tailwind CSS 4.2 |
| **Routing** | React Router v7 |
| **State Management**| Zustand 5 |
| **Network & Comms**| Axios 1.13, STOMP.js 7.3 (WebSocket) |
| **UI Assets** | Lucide React 0.577 |
| **Testing** | Vitest, React Testing Library |
| **Linting** | ESLint 9 (Strict TS Support) |

---

## 🏗️ Architecture & Structure
The codebase is organized following a **Feature-Sliced Design** approach to maximize scalability.

```text
📦 src
 ┣ 📂 app        # Core setup (providers, router, layouts, guards, chat utils)
 ┣ 📂 modules    # Feature-based silos (types, components, services, schemas)
 ┣ 📂 pages      # Page-level components (public, app, and platform pages)
 ┣ 📂 components # Reusable UI blocks (buttons, navigation, sections)
 ┣ 📂 services   # API handlers, HTTP setup, and real-time services
 ┣ 📂 store      # Global state management using Zustand
 ┗ 📂 hooks      # Custom React hooks (useAuth, useTheme, usePageMeta)
```

---

## ⚡ Under the Hood: Advanced Features

- 🔐 **Route Guards**: Strictly protected routes with role-based access control (RBAC)  
- 🎨 **Dynamic Theming**: Built-in Dark/Light mode support via Theme Provider  
- 📍 **SEO & Metadata**: Dynamic page metadata management using Page Meta Context  
- 📦 **Optimized Bundling**: Aggressive code splitting across React, Router, Network, State, and Icons  

---

## 🧪 Quality & Configuration
We take code quality seriously. WorkNest is configured for strict reliability:

- ✅ **Testing**: Robust unit testing setup using Vitest and JSDOM  
- 📝 **Typing**: Strict-mode TypeScript configuration prevents runtime errors  
- 🔍 **Linting**: Aggressive ESLint rules for clean, maintainable code  
- 🧭 **Clean Imports**: Configured path aliases (`@/`) to avoid messy relative imports  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/worknest-client.git
```

### 2. Navigate to the project directory
```bash
cd worknest-client
```

###3. Install dependencies
```bash
npm install
```

### 4. Start the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
See the LICENSE file for more details.
