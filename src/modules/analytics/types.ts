export interface DistributionDatum {
  label: string;
  value: number;
  color: string;
}

export interface ProgressDatum {
  label: string;
  value: number;
}

export interface AttendanceTrendDatum {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface TaskPreview {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
}

export interface LeavePreview {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface AnnouncementPreview {
  id: string;
  title: string;
  createdAt: string;
}

export interface NotificationPreview {
  id: string;
  title: string;
  createdAt: string;
  read: boolean;
}

export interface TenantAnalyticsData {
  totalEmployees: number;
  activeProjects: number;
  openTasks: number;
  pendingLeaves: number;
  presentToday: number;
  taskStatusDistribution: DistributionDatum[];
  projectProgress: ProgressDatum[];
  workloadByEmployee: ProgressDatum[];
  attendanceTrend: AttendanceTrendDatum[];
  leaveStatusDistribution: DistributionDatum[];
  upcomingDeadlines: TaskPreview[];
}

export interface TenantDashboardSnapshot {
  totalEmployees: number;
  activeProjects: number;
  openTasks: number;
  pendingLeaves: number;
  presentToday: number;
  recentTasks: TaskPreview[];
  pendingApprovals: LeavePreview[];
  announcements: AnnouncementPreview[];
  notifications: NotificationPreview[];
}

export interface PlatformAnalyticsData {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  inactiveTenants: number;
  newlyAddedThisMonth: number;
  tenantStatusDistribution: DistributionDatum[];
  tenantGrowthByMonth: ProgressDatum[];
}
