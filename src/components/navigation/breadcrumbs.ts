export interface BreadcrumbItem {
  label: string;
  to: string;
  current: boolean;
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  reports: 'Reports',
  employees: 'Employees',
  teams: 'Teams',
  projects: 'Projects',
  tasks: 'Tasks',
  board: 'Board',
  attendance: 'Attendance',
  leave: 'Leave',
  recruitment: 'Recruitment',
  jobs: 'Job Openings',
  applications: 'Applications',
  'email-templates': 'Email Templates',
  announcements: 'Announcements',
  notifications: 'Notifications',
  chat: 'Chat',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  workspace: 'Company',
  security: 'Security',
  preferences: 'Preferences',
  profile: 'Profile',
  tenants: 'Tenants',
  users: 'Users',
  new: 'New',
  create: 'New',
  edit: 'Edit',
  preview: 'Preview',
};

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replaceAll('&', 'and');
}

function titleCase(value: string): string {
  return decodeURIComponent(value)
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function deriveLabels(area: 'tenant' | 'platform', pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);
  const routeSegments = area === 'tenant' ? segments.slice(1) : segments.slice(1);
  const root = area === 'tenant' ? 'Workspace' : 'Platform';
  if (!routeSegments.length) return [root];
  return [root, ...routeSegments.map((segment, index) => {
    if (/^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)) {
      return index === routeSegments.length - 1 ? 'Details' : titleCase(segment);
    }
    return SEGMENT_LABELS[segment.toLowerCase()] ?? titleCase(segment);
  })];
}

function tenantPath(tenantSlug: string, route: string): string {
  return `/${tenantSlug}/${route}`.replace(/\/$/, '');
}

function canonicalPath(area: 'tenant' | 'platform', tenantSlug: string, label: string, previousLabel?: string): string | null {
  const key = normalizeLabel(label);
  if (area === 'platform') {
    const platformRoutes: Record<string, string> = {
      platform: '/platform/dashboard', dashboard: '/platform/dashboard', operations: '/platform/dashboard',
      analytics: '/platform/analytics', reports: '/platform/reports', tenants: '/platform/tenants',
      users: '/platform/users', 'platform users': '/platform/users', 'audit logs': '/platform/audit-logs',
      profile: '/platform/profile',
    };
    return platformRoutes[key] ?? null;
  }

  if (key === 'workspace' && normalizeLabel(previousLabel ?? '') === 'settings') {
    return tenantPath(tenantSlug, 'settings/workspace');
  }
  if (key === 'profile' && normalizeLabel(previousLabel ?? '') === 'settings') {
    return tenantPath(tenantSlug, 'settings/profile');
  }

  const tenantRoutes: Record<string, string> = {
    workspace: 'dashboard', dashboard: 'dashboard', analytics: 'analytics', reports: 'reports',
    employees: 'employees', teams: 'teams', projects: 'projects', tasks: 'tasks', attendance: 'attendance',
    leave: 'leave', recruitment: 'recruitment/jobs', 'job openings': 'recruitment/jobs',
    applications: 'recruitment/applications', announcements: 'announcements', notifications: 'notifications',
    chat: 'chat', 'audit logs': 'audit-logs', settings: 'settings/profile', company: 'settings/workspace',
    security: 'settings/security', preferences: 'settings/preferences', profile: 'profile',
    'email templates': 'recruitment/email-templates',
  };
  return tenantRoutes[key] ? tenantPath(tenantSlug, tenantRoutes[key]) : null;
}

export function buildBreadcrumbItems({
  area,
  pathname,
  search = '',
  hash = '',
  labels = [],
  tenantSlug,
}: {
  area: 'tenant' | 'platform';
  pathname: string;
  search?: string;
  hash?: string;
  labels?: string[];
  tenantSlug?: string | null;
}): BreadcrumbItem[] {
  const resolvedLabels = labels.length ? labels : deriveLabels(area, pathname);
  const resolvedTenant = tenantSlug ?? pathname.split('/').filter(Boolean)[0] ?? 'app';
  const currentTarget = `${pathname}${search}${hash}`;

  return resolvedLabels.map((label, index) => {
    const current = index === resolvedLabels.length - 1;
    const canonical = canonicalPath(area, resolvedTenant, label, resolvedLabels[index - 1]);
    return { label, current, to: current ? currentTarget : canonical ?? currentTarget };
  });
}
