import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  FileCheck,
  Kanban,
  LayoutGrid,
  Megaphone,
  MessageSquareText,
  Users,
} from 'lucide-react'

export interface ValueHighlight {
  title: string
  description: string
}

export interface PillarItem {
  title: string
  description: string
}

export interface ModuleFeature {
  title: string
  description: string
  icon: LucideIcon
}

export interface HowItWorksStep {
  title: string
  description: string
}

export interface RoleBenefit {
  role: string
  summary: string
  points: string[]
}

export interface SecurityPoint {
  title: string
  description: string
}

export const VALUE_HIGHLIGHTS: ValueHighlight[] = [
  {
    title: 'Multi-tenant architecture',
    description: 'Each company operates in an isolated and scalable workspace.',
  },
  {
    title: 'Team collaboration',
    description: 'Coordinate teams, projects, and communication in one place.',
  },
  {
    title: 'Task and Kanban workflows',
    description: 'Keep delivery visible with structured task pipelines and status flows.',
  },
  {
    title: 'Attendance and leave',
    description: 'Track workforce availability with reliable operational records.',
  },
  {
    title: 'Role-based access',
    description: 'Grant the right access to admins, managers, HR, and employees.',
  },
]

export const FEATURE_PILLARS: PillarItem[] = [
  {
    title: 'One platform for operations',
    description:
      'From employee records to daily execution, WorkNest centralizes how teams run the company.',
  },
  {
    title: 'Built for growing companies',
    description:
      'Start with one workspace, then scale across departments without losing structure or control.',
  },
  {
    title: 'Actionable visibility',
    description:
      'Managers and admins can monitor activity, bottlenecks, and progress without context switching.',
  },
]

export const MODULE_FEATURES: ModuleFeature[] = [
  {
    title: 'Employee Management',
    description: 'Maintain complete employee profiles and workspace assignments.',
    icon: Users,
  },
  {
    title: 'Team Management',
    description: 'Structure teams by function, project, and reporting lines.',
    icon: LayoutGrid,
  },
  {
    title: 'Project Tracking',
    description: 'Monitor project milestones and ownership from kickoff to delivery.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Task Management',
    description: 'Assign tasks, due dates, priorities, and dependencies clearly.',
    icon: ClipboardList,
  },
  {
    title: 'Kanban Workflow',
    description: 'Visualize work in progress and flow with structured Kanban boards.',
    icon: Kanban,
  },
  {
    title: 'Attendance Tracking',
    description: 'Record attendance trends and daily workforce availability.',
    icon: CalendarClock,
  },
  {
    title: 'Leave Requests',
    description: 'Manage leave requests with consistent approval workflows.',
    icon: FileCheck,
  },
  {
    title: 'Announcements',
    description: 'Share updates from leadership, HR, and teams in real time.',
    icon: Megaphone,
  },
  {
    title: 'Notifications',
    description: 'Keep users informed about task updates and operational events.',
    icon: Bell,
  },
  {
    title: 'Team Collaboration',
    description: 'Encourage alignment with shared workspaces and communication loops.',
    icon: MessageSquareText,
  },
]

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    title: 'Create workspace',
    description: 'Register your company and launch a dedicated tenant workspace in minutes.',
  },
  {
    title: 'Add teams and employees',
    description: 'Bring your people into WorkNest with clear team structures and permissions.',
  },
  {
    title: 'Manage work and operations',
    description: 'Run tasks, projects, attendance, leave, and communication from one platform.',
  },
  {
    title: 'Track progress in one place',
    description: 'Use centralized visibility to keep goals, delivery, and operations aligned.',
  },
]

export const ROLE_BENEFITS: RoleBenefit[] = [
  {
    role: 'Admin',
    summary: 'Control workspace setup, roles, and organizational governance.',
    points: ['Tenant setup and controls', 'Permissions and policy enforcement'],
  },
  {
    role: 'Manager',
    summary: 'Lead teams, assign work, and monitor execution quality.',
    points: ['Task and project ownership', 'Performance and delivery visibility'],
  },
  {
    role: 'HR',
    summary: 'Handle workforce operations with dependable records and workflows.',
    points: ['Attendance and leave process', 'Employee lifecycle consistency'],
  },
  {
    role: 'Employee',
    summary: 'Get clarity on priorities, updates, and collaboration context.',
    points: ['Personal task visibility', 'Streamlined communication'],
  },
]

export const SECURITY_POINTS: SecurityPoint[] = [
  {
    title: 'Isolated workspaces',
    description: 'Company data stays segmented by tenant boundaries to reduce cross-tenant risk.',
  },
  {
    title: 'Role-based access',
    description: 'Permissions can be assigned by responsibility to protect sensitive operations.',
  },
  {
    title: 'Audit-friendly operations',
    description: 'Operational events and workflow decisions remain traceable for accountability.',
  },
  {
    title: 'Scalable SaaS-ready structure',
    description: 'The platform foundation is prepared for future growth across modules and users.',
  },
]

export const HERO_METRICS = [
  { label: 'Teams coordinated', value: '42' },
  { label: 'Tasks completed', value: '12.4k' },
  { label: 'Workspace uptime', value: '99.95%' },
] as const

export const HERO_BADGES = ['Tenant-ready', 'Role-aware', 'Operationally aligned'] as const
