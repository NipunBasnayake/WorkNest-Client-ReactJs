export interface DistributionDatum {
  label: string;
  value: number;
  color: string;
}

export interface ProgressDatum {
  label: string;
  value: number;
  id?: string;
  secondaryValue?: number;
}
export type AnalyticsDomain = 'overview' | 'employees' | 'attendance' | 'leave' | 'projects' | 'tasks' | 'recruitment' | 'teams';

export interface AnalyticsFilters {
  fromDate: string;
  toDate: string;
  department: string;
  projectId: string;
  teamId: string;
  employeeId: string;
  status: string;
  recruitmentStatus: string;
  attendancePeriod: string;
  leaveType: string;
}

export interface BiMetric {
  key: string; label: string; value: number; unit: string; changePercent: number | null; tone: string; context: string;
}
export interface BiChartPoint { label: string; value: number; secondaryValue: number | null; tertiaryValue: number | null; id: string | null; }
export interface BiInsight { id: string; severity: 'positive' | 'info' | 'warning' | 'critical'; title: string; description: string; route?: string; }
export interface BiRisk { id: string; severity: 'warning' | 'critical'; title: string; description: string; count: number; route: string; }
export interface BiActivity { id: string; actor: string; action: string; entityType: string; occurredAt: string; }
export interface BusinessIntelligenceData {
  generatedAt: string;
  range: { fromDate: string; toDate: string };
  kpis: BiMetric[];
  charts: Record<string, BiChartPoint[]>;
  insights: BiInsight[];
  risks: BiRisk[];
  recentActivities: BiActivity[];
  filterOptions: AnalyticsFilterOptions & {
    taskStatuses: AnalyticsFilterOption[];
    recruitmentStatuses: AnalyticsFilterOption[];
    leaveTypes: AnalyticsFilterOption[];
  };
}

export interface AnalyticsFilterOption { value: string; label: string; }
export interface AnalyticsFilterOptions {
  departments: AnalyticsFilterOption[];
  projects: AnalyticsFilterOption[];
  teams: AnalyticsFilterOption[];
  employees: AnalyticsFilterOption[];
}

export interface BusinessInsight {
  id: string;
  severity: 'positive' | 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export interface RecruitmentAnalytics {
  openJobs: number;
  totalCandidates: number;
  activeApplications: number;
  hiredCandidates: number;
  upcomingInterviews: number;
  stageDistribution: DistributionDatum[];
}

export interface AttendanceTrendDatum {
  date: string;
  present: number;
  late: number;
  halfDay: number;
  incomplete: number;
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
  link?: string;
}

export interface DashboardTaskStatusSummary {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  BLOCKED: number;
  DONE: number;
}

export interface DashboardLeaveStatusSummary {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  CANCELLED: number;
}

export interface DashboardAttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  incomplete: number;
  myTodayStatus: "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "INCOMPLETE" | "NOT_MARKED";
  myWorkedMinutes: number;
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
  overdueTasks: TaskPreview[];
  employeeRoleDistribution: DistributionDatum[];
  employeeDesignationDistribution: DistributionDatum[];
  teamWorkload: ProgressDatum[];
  recruitment?: RecruitmentAnalytics;
  filterOptions: AnalyticsFilterOptions;
  insights: BusinessInsight[];
  generatedAt: string;
}

export interface TenantDashboardSnapshot {
  totalEmployees: number;
  activeTeams: number;
  activeProjects: number;
  completedTasks: number;
  openTasks: number;
  pendingLeaves: number;
  presentToday: number;
  unreadNotifications: number;
  taskStatusSummary: DashboardTaskStatusSummary;
  leaveStatusSummary: DashboardLeaveStatusSummary;
  attendanceSummary: DashboardAttendanceSummary;
  dueSoonTasks: TaskPreview[];
  recentTasks: TaskPreview[];
  recentLeaves: LeavePreview[];
  pendingApprovals: LeavePreview[];
  announcements: AnnouncementPreview[];
  notifications: NotificationPreview[];
}
