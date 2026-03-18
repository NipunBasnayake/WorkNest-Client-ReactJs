import type { Feature, Step, RoleBenefit } from "@/types";

export const VALUE_HIGHLIGHTS = [
  "Multi-Tenant Architecture",
  "Team Collaboration",
  "Task & Kanban Workflows",
  "Attendance & Leave",
  "Secure Role-Based Access",
];

export const FEATURES: Feature[] = [
  {
    icon: "Users",
    title: "Employee Management",
    description:
      "Centralized employee profiles, onboarding workflows, and organizational hierarchy in one place.",
  },
  {
    icon: "UsersRound",
    title: "Team Management",
    description:
      "Create and manage cross-functional teams with clear roles, responsibilities, and collaboration tools.",
  },
  {
    icon: "FolderKanban",
    title: "Project Tracking",
    description:
      "Plan, track, and deliver projects on time with milestones, timelines, and progress dashboards.",
  },
  {
    icon: "CheckSquare",
    title: "Task Management",
    description:
      "Assign, prioritize, and track tasks with deadlines, labels, and real-time status updates.",
  },
  {
    icon: "Columns3",
    title: "Kanban Workflow",
    description:
      "Visual drag-and-drop boards to manage work across customizable stages and pipelines.",
  },
  {
    icon: "Clock",
    title: "Attendance Tracking",
    description:
      "Automated check-in/check-out with daily logs, reports, and overtime calculations.",
  },
  {
    icon: "CalendarDays",
    title: "Leave Requests",
    description:
      "Streamlined leave applications with approval workflows, balance tracking, and calendar views.",
  },
  {
    icon: "Megaphone",
    title: "Announcements",
    description:
      "Company-wide or team-specific announcements with read receipts and priority levels.",
  },
  {
    icon: "Bell",
    title: "Notifications",
    description:
      "Real-time in-app notifications for tasks, approvals, mentions, and system events.",
  },
  {
    icon: "MessageSquare",
    title: "Team Collaboration",
    description:
      "Built-in messaging and discussion threads to keep your team connected and aligned.",
  },
];

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Create Your Workspace",
    description:
      "Sign up and set up your company workspace in minutes. Configure your organization structure and invite your team.",
  },
  {
    number: "02",
    title: "Build Your Teams",
    description:
      "Add employees, create departments, and assign roles. Define team structures that mirror your organization.",
  },
  {
    number: "03",
    title: "Manage Operations",
    description:
      "Create projects, assign tasks, track attendance, and manage leave requests — all from one unified dashboard.",
  },
  {
    number: "04",
    title: "Track & Optimize",
    description:
      "Monitor progress with real-time analytics, generate reports, and continuously optimize your team's productivity.",
  },
];

export const ROLE_BENEFITS: RoleBenefit[] = [
  {
    role: "Admin",
    description: "Complete control over your workspace",
    highlights: [
      "Workspace configuration",
      "User & role management",
      "Company-wide analytics",
      "Audit logs & security",
    ],
  },
  {
    role: "Manager",
    description: "Empower your team's productivity",
    highlights: [
      "Team & project oversight",
      "Task assignment & tracking",
      "Performance monitoring",
      "Approval workflows",
    ],
  },
  {
    role: "HR",
    description: "Streamline people operations",
    highlights: [
      "Employee onboarding",
      "Attendance management",
      "Leave administration",
      "Announcements & policies",
    ],
  },
  {
    role: "Employee",
    description: "Focus on what matters most",
    highlights: [
      "Personal task dashboard",
      "Time & attendance logs",
      "Leave applications",
      "Team collaboration",
    ],
  },
];

export const SECURITY_FEATURES = [
  {
    title: "Isolated Workspaces",
    description:
      "Each company operates in a fully isolated environment. Data never leaks across tenants.",
  },
  {
    title: "Role-Based Access Control",
    description:
      "Granular permissions ensure users only access what they need. Every action is scoped to their role.",
  },
  {
    title: "Audit-Friendly Operations",
    description:
      "Complete activity logs and audit trails for compliance, security reviews, and accountability.",
  },
  {
    title: "Scalable SaaS Architecture",
    description:
      "Built on modern cloud infrastructure designed to grow with your organization seamlessly.",
  },
];
