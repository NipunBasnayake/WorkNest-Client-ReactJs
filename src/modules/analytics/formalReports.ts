import type { AnalyticsFilters } from '@/modules/analytics/types';
import type { NormalizedAppRole } from '@/constants/rolePermissionMap';
import type { ReportCell } from '@/modules/analytics/reportExport';
import { getEmployees } from '@/modules/employees/services/employeeService';
import { getAttendanceRecordsByRange } from '@/modules/attendance/services/attendanceService';
import { getLeaveRequests } from '@/modules/leave/services/leaveService';
import { getProjects } from '@/modules/projects/services/projectService';
import { getAllTasksForProjectReport, getTasks } from '@/modules/tasks/services/taskService';
import { getTeams } from '@/modules/teams/services/teamService';
import { getAuditLogs } from '@/modules/audit/services/auditLogService';
import { getBusinessIntelligenceReport, getTenantAnalyticsData } from '@/modules/analytics/services/analyticsService';
import { apiClient } from '@/services/http/client';
import { unwrapApiData } from '@/services/http/response';
import { asRecord, extractList, firstDefined, getNumber, getString } from '@/services/http/parsers';
import type { ApiResponse } from '@/types';

export type FormalReportId = 'employees' | 'attendance' | 'leave' | 'projects' | 'tasks' | 'recruitment-jobs' | 'recruitment-applications' | 'recruitment-interviews' | 'recruitment-hiring' | 'teams' | 'audit' | 'notifications' | 'organization' | 'system-health' | 'departments' | 'new-joiners' | 'employee-status' | 'project-progress' | 'workload';
export interface FormalReportDefinition { id: FormalReportId; title: string; description: string; group: string; serverPaginated?: boolean; }
export interface FormalReportColumn { key: string; label: string; align?: 'left' | 'right'; }
export interface FormalReportSupportingChart { title: string; subtitle: string; variant: 'line' | 'bar' | 'horizontalBar' | 'donut' | 'pie'; data: Array<{ label: string; value: number; secondaryValue: null; tertiaryValue: null; id: null }>; }
export interface FormalReportPagination { page: number; size: number; totalElements: number; totalPages: number; }
export interface FormalReportRequest { page: number; size: number; search: string; sort: { key: string; direction: 'asc' | 'desc' } | null; columnFilters: Record<string, string>; }
export interface FormalReportData { title: string; description: string; columns: FormalReportColumn[]; rows: Array<Record<string, ReportCell>>; summary: Array<{ label: string; value: string | number }>; supportingCharts: FormalReportSupportingChart[]; generatedAt: string; pagination?: FormalReportPagination; }

const definitions: Record<FormalReportId, FormalReportDefinition> = {
  employees: { id: 'employees', title: 'Employee Report', description: 'Auditable employee directory, role, department, status, and joining information.', group: 'People' },
  attendance: { id: 'attendance', title: 'Attendance Report', description: 'Daily attendance records with check-in, check-out, lateness, and work status.', group: 'People' },
  leave: { id: 'leave', title: 'Leave Report', description: 'Leave requests, utilization dates, decision status, and employee ownership.', group: 'People' },
  projects: { id: 'projects', title: 'Project Report', description: 'Portfolio register with ownership, schedule, and delivery status.', group: 'Delivery' },
  tasks: { id: 'tasks', title: 'Task Report', description: 'Detailed work register for assignments, priorities, deadlines, and workflow status.', group: 'Delivery' },
  'recruitment-jobs': { id: 'recruitment-jobs', title: 'Job Openings Report', description: 'Openings, publishing state, deadlines, capacity, and applicant demand.', group: 'Recruitment', serverPaginated: true },
  'recruitment-applications': { id: 'recruitment-applications', title: 'Applications Report', description: 'Candidate applications by position, department, pipeline stage, and application date.', group: 'Recruitment', serverPaginated: true },
  'recruitment-interviews': { id: 'recruitment-interviews', title: 'Interview Report', description: 'Interview schedule, candidate, interviewer, mode, and outcome status.', group: 'Recruitment', serverPaginated: true },
  'recruitment-hiring': { id: 'recruitment-hiring', title: 'Hiring Report', description: 'Completed hires and their employee-account conversion state.', group: 'Recruitment', serverPaginated: true },
  teams: { id: 'teams', title: 'Team Report', description: 'Team register with management ownership and active membership.', group: 'Organization' },
  audit: { id: 'audit', title: 'Audit Report', description: 'Governance-ready history of actors, actions, entities, and timestamps.', group: 'Governance' },
  notifications: { id: 'notifications', title: 'Notification Report', description: 'Tenant notification delivery, category, recipient, and read-status register.', group: 'System', serverPaginated: true },
  organization: { id: 'organization', title: 'Organization Summary', description: 'Formal company KPI statement for the selected reporting period.', group: 'Executive' },
  'system-health': { id: 'system-health', title: 'System Health Report', description: 'Operational warnings, communication volume, and system risk statement.', group: 'System' },
  departments: { id: 'departments', title: 'Department Report', description: 'Department-level workforce totals for capacity review.', group: 'People' },
  'new-joiners': { id: 'new-joiners', title: 'New Joiners Report', description: 'Employees who joined within the selected reporting period.', group: 'People' },
  'employee-status': { id: 'employee-status', title: 'Employee Status Report', description: 'Employee account and employment status register.', group: 'People' },
  'project-progress': { id: 'project-progress', title: 'Project Progress Report', description: 'Project completion statement based on completed and total work.', group: 'Delivery' },
  workload: { id: 'workload', title: 'Workload Report', description: 'Assigned work totals by employee for resource planning.', group: 'Delivery' },
};

export function getReportCatalog(role: NormalizedAppRole | null): FormalReportDefinition[] {
  const ids: FormalReportId[] = role === 'TENANT_ADMIN'
    ? ['employees', 'attendance', 'leave', 'projects', 'tasks', 'recruitment-jobs', 'recruitment-applications', 'recruitment-interviews', 'recruitment-hiring', 'teams', 'audit', 'notifications', 'organization', 'system-health']
    : role === 'HR'
      ? ['employees', 'attendance', 'leave', 'recruitment-jobs', 'recruitment-applications', 'recruitment-interviews', 'recruitment-hiring', 'departments', 'new-joiners', 'employee-status']
      : role === 'MANAGER'
        ? ['teams', 'project-progress', 'tasks', 'workload']
        : [];
  return ids.map((id) => definitions[id]);
}

export function getFormalReportStatusOptions(id: FormalReportId): string[] {
  if (['employees', 'new-joiners', 'employee-status'].includes(id)) return ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (id === 'attendance') return ['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'INCOMPLETE'];
  if (id === 'leave') return ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  if (id === 'projects') return ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  if (id === 'tasks') return ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'];
  if (id === 'notifications') return ['READ', 'UNREAD'];
  if (id === 'recruitment-jobs') return ['OPEN', 'PAUSED', 'CLOSED'];
  if (id === 'recruitment-interviews') return ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'];
  return [];
}

const text = (value: unknown, fallback = '—') => getString(value) ?? fallback;
const date = (value: unknown) => { const raw = getString(value); return raw ? new Date(raw).toLocaleDateString() : '—'; };
const dateTime = (value: unknown) => { const raw = getString(value); return raw ? new Date(raw).toLocaleString() : '—'; };
const daysBetween = (start: unknown, end: unknown) => { const from = getString(start); const to = getString(end); if (!from || !to) return '—'; return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1); };

const projectDatabaseStatus = (value: string) => ({
  planned: 'PLANNED',
  active: 'IN_PROGRESS',
  on_hold: 'ON_HOLD',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}[value] ?? value.toUpperCase());
const highestTaskPriority = (values: string[]) => {
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return values.reduce<string | undefined>((highest, value) =>
    order.indexOf(value) > order.indexOf(highest ?? '') ? value : highest, undefined);
};

export async function loadFormalReport(id: FormalReportId, filters: AnalyticsFilters, _role: NormalizedAppRole, request?: FormalReportRequest): Promise<FormalReportData> {
  const definition = definitions[id];
  if (isRecruitmentReport(id)) return loadRecruitmentReport(definition, id, filters, request);
  if (id === 'notifications') return loadNotificationReport(definition, filters, request);
  let columns: FormalReportColumn[] = [];
  let rows: Array<Record<string, ReportCell>> = [];
  if (id === 'employees' || id === 'new-joiners' || id === 'employee-status') {
    const items = await getEmployees();
    columns = [{ key: 'code', label: 'Employee ID' }, { key: 'name', label: 'Employee' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'role', label: 'Role' }, { key: 'joined', label: 'Joined' }, { key: 'status', label: 'Status' }];
    rows = items.map((item) => ({ employeeId: text(item.id, ''), code: text(item.employeeCode), name: text(item.name), email: text(item.email), department: text(item.department), designation: text(item.designation ?? item.position), role: text(item.role), joined: date(item.joinedDate ?? item.joinedAt), joinedRaw: text(item.joinedDate ?? item.joinedAt, ''), recordDate: text(item.joinedDate ?? item.joinedAt, '').slice(0, 10), status: text(item.status) }));
    if (id === 'new-joiners') rows = rows.filter((item) => String(item.joinedRaw) >= filters.fromDate && String(item.joinedRaw) <= filters.toDate);
  } else if (id === 'attendance') {
    const items = await getAttendanceRecordsByRange(filters.fromDate, filters.toDate, { employeeId: filters.employeeId, department: filters.department });
    columns = [{ key: 'date', label: 'Date' }, { key: 'employee', label: 'Employee' }, { key: 'checkIn', label: 'Check in' }, { key: 'checkOut', label: 'Check out' }, { key: 'status', label: 'Status' }, { key: 'late', label: 'Late' }, { key: 'worked', label: 'Worked minutes', align: 'right' }];
    rows = items.map((item) => ({ date: date(item.date), recordDate: text(item.date, ''), employeeId: item.employeeId, employee: item.employeeName, checkIn: dateTime(item.checkIn), checkOut: dateTime(item.checkOut), status: item.late ? 'LATE' : item.status, late: item.late ? 'Yes' : 'No', worked: item.workedMinutes ?? '—' }));
  } else if (id === 'leave') {
    const [items, employees] = await Promise.all([getLeaveRequests(), getEmployees()]);
    const employeeDepartments = new Map(employees.map((employee) => [String(employee.id), text(employee.department)]));
    columns = [{ key: 'employee', label: 'Employee' }, { key: 'type', label: 'Leave type' }, { key: 'start', label: 'Start' }, { key: 'end', label: 'End' }, { key: 'days', label: 'Days', align: 'right' }, { key: 'status', label: 'Status' }, { key: 'reason', label: 'Reason' }];
    rows = items.map((item) => ({ employeeId: text(item.employeeId, ''), employee: text(item.employeeName), department: employeeDepartments.get(String(item.employeeId)) ?? '—', type: text(item.leaveType), start: date(item.startDate), end: date(item.endDate), recordDate: text(item.startDate, ''), days: daysBetween(item.startDate, item.endDate), status: text(item.status), reason: text(item.reason) }));
  } else if (id === 'projects') {
    const [items, allTasks] = await Promise.all([getProjects(), getAllTasksForProjectReport()]);
    const tasks = allTasks.filter((task) =>
      (!filters.teamId || String(task.assignedTeamId ?? '') === filters.teamId)
      && (!filters.employeeId || String(firstDefined(task.assigneeEmployeeId, task.assignedEmployeeId, task.assigneeId) ?? '') === filters.employeeId));
    const tasksByProject = new Map<string, typeof tasks>();
    tasks.forEach((task) => {
      const projectId = String(task.projectId ?? '');
      if (!projectId) return;
      const projectTasks = tasksByProject.get(projectId) ?? [];
      projectTasks.push(task);
      tasksByProject.set(projectId, projectTasks);
    });
    const participantIdsByProject = new Map<string, Set<string>>();
    allTasks.forEach((task) => {
      const projectId = String(task.projectId ?? '');
      const employeeId = String(firstDefined(task.assigneeEmployeeId, task.assignedEmployeeId, task.assigneeId) ?? '');
      if (!projectId || !employeeId) return;
      const employeeIds = participantIdsByProject.get(projectId) ?? new Set<string>();
      employeeIds.add(employeeId);
      participantIdsByProject.set(projectId, employeeIds);
    });
    columns = [
      { key: 'name', label: 'Project' },
      { key: 'status', label: 'Status' },
      { key: 'start', label: 'Start date' },
      { key: 'end', label: 'End date' },
      { key: 'owner', label: 'Created by' },
      { key: 'taskCompletion', label: 'Task completion', align: 'right' },
      { key: 'priority', label: 'Highest task priority' },
      { key: 'created', label: 'Created' },
    ];
    rows = items.map((item) => {
      const projectTasks = tasksByProject.get(String(item.id)) ?? [];
      const taskDone = projectTasks.filter((task) => task.status === 'DONE').length;
      const completionRate = projectTasks.length ? Math.round(taskDone * 1000 / projectTasks.length) / 10 : 0;
      const priority = highestTaskPriority(projectTasks.map((task) => task.priority));
      const ownerId = String(item.createdBy?.id ?? '');
      const employeeIds = new Set(participantIdsByProject.get(String(item.id)) ?? []);
      if (ownerId) employeeIds.add(ownerId);
      return {
        projectId: item.id,
        teamIdsCsv: item.teamIds.join(','),
        employeeIdsCsv: [...employeeIds].join(','),
        name: item.name,
        status: projectDatabaseStatus(item.status),
        start: date(item.startDate),
        startRaw: text(item.startDate, ''),
        end: date(item.endDate),
        owner: text(firstDefined(asRecord(item).createdByName, asRecord(asRecord(item).createdBy).name)),
        taskTotal: projectTasks.length,
        taskDone,
        completionRate,
        taskCompletion: projectTasks.length ? `${completionRate}%` : 'No data available',
        priority: priority ?? '',
        created: dateTime(item.createdAt),
        recordDate: text(item.createdAt, '').slice(0, 10),
      };
    });
  } else if (id === 'tasks') {
    const items = await getTasks();
    columns = [{ key: 'title', label: 'Task' }, { key: 'project', label: 'Project' }, { key: 'team', label: 'Team' }, { key: 'assignee', label: 'Assignee' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'due', label: 'Due date' }];
    rows = items.map((item) => ({ title: item.title, projectId: text(item.projectId, ''), project: text(item.projectName), teamId: text(item.assignedTeamId, ''), team: text(item.assignedTeamName), employeeId: text(firstDefined(item.assigneeEmployeeId, item.assignedEmployeeId, item.assigneeId), ''), assignee: text(item.assigneeName), priority: item.priority, status: item.status, due: date(item.dueDate), recordDate: text(item.dueDate, '') }));
  } else if (id === 'teams') {
    const items = await getTeams();
    columns = [{ key: 'name', label: 'Team' }, { key: 'manager', label: 'Manager' }, { key: 'members', label: 'Members', align: 'right' }, { key: 'description', label: 'Description' }];
    rows = items.map((item) => ({ teamId: item.id, name: item.name, manager: text(item.managerName), members: getNumber(asRecord(item).memberCount) ?? 0, description: text(item.description) }));
  } else if (id === 'audit') {
    const result = await getAuditLogs({ fromDate: filters.fromDate, toDate: filters.toDate, size: 200 });
    const remainingAuditPages = await Promise.all(Array.from({ length: Math.max(0, result.totalPages - 1) }, (_, index) =>
      getAuditLogs({ fromDate: filters.fromDate, toDate: filters.toDate, page: index + 1, size: 200 })));
    const auditItems = [result, ...remainingAuditPages].flatMap((page) => page.items);
    columns = [{ key: 'time', label: 'Timestamp' }, { key: 'actor', label: 'Actor' }, { key: 'action', label: 'Action' }, { key: 'entity', label: 'Entity type' }, { key: 'entityId', label: 'Entity ID' }];
    rows = auditItems.map((item) => ({ employeeId: text(item.actorId, ''), time: dateTime(item.createdAt), recordDate: text(item.createdAt, '').slice(0, 10), actor: text(item.actorEmail), action: item.action, entity: item.entityType, entityId: item.entityId ?? '—' }));
  } else if (id === 'departments' || id === 'organization' || id === 'system-health') {
    const bi = await getBusinessIntelligenceReport(filters);
    if (id === 'departments') { columns = [{ key: 'department', label: 'Department' }, { key: 'employees', label: 'Employees', align: 'right' }]; rows = (bi.charts.employeesByDepartment ?? []).map((item) => ({ department: item.label, employees: item.value })); }
    else if (id === 'organization') { columns = [{ key: 'indicator', label: 'Indicator' }, { key: 'value', label: 'Value', align: 'right' }, { key: 'context', label: 'Reporting context' }]; rows = bi.kpis.map((item) => ({ indicator: item.label, value: `${item.value}${item.unit}`, context: item.context })); }
    else { columns = [{ key: 'severity', label: 'Severity' }, { key: 'risk', label: 'Risk indicator' }, { key: 'count', label: 'Count', align: 'right' }, { key: 'recommendation', label: 'Recommended action' }]; rows = bi.risks.map((item) => ({ severity: item.severity.toUpperCase(), risk: item.title, count: item.count, recommendation: item.description })); }
  } else if (id === 'project-progress' || id === 'workload') {
    const analytics = await getTenantAnalyticsData(filters);
    const items = id === 'project-progress' ? analytics.projectProgress : analytics.workloadByEmployee;
    columns = id === 'project-progress' ? [{ key: 'name', label: 'Project' }, { key: 'value', label: 'Completion', align: 'right' }] : [{ key: 'name', label: 'Employee' }, { key: 'value', label: 'Assigned tasks', align: 'right' }];
    rows = items.map((item) => ({ ...(id === 'project-progress' ? { projectId: item.id ?? '' } : { employeeId: item.id ?? '' }), name: item.label, value: id === 'project-progress' ? `${item.value}%` : item.value }));
  }
  rows = applyStructuredFilters(id, rows, filters);
  return { title: definition.title, description: definition.description, columns, rows, summary: buildSummary(id, rows), supportingCharts: buildSupportingCharts(id, rows), generatedAt: new Date().toISOString() };
}

export async function loadFullFormalReport(id: FormalReportId, filters: AnalyticsFilters, role: NormalizedAppRole, request: FormalReportRequest): Promise<FormalReportData> {
  if (!definitions[id].serverPaginated) return loadFormalReport(id, filters, role);
  const first = await loadFormalReport(id, filters, role, { ...request, page: 0, size: 200 });
  const rows = [...first.rows];
  const totalPages = first.pagination?.totalPages ?? 1;
  const remainingPages = await Promise.all(Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
    loadFormalReport(id, filters, role, { ...request, page: index + 1, size: 200 })));
  rows.push(...remainingPages.flatMap((page) => page.rows));
  return { ...first, rows, pagination: undefined };
}

function isRecruitmentReport(id: FormalReportId): id is Extract<FormalReportId, `recruitment-${string}`> {
  return id.startsWith('recruitment-');
}

async function loadRecruitmentReport(definition: FormalReportDefinition, id: Extract<FormalReportId, `recruitment-${string}`>, filters: AnalyticsFilters, request?: FormalReportRequest): Promise<FormalReportData> {
  const reportType = id === 'recruitment-jobs' ? 'job-openings' : id.replace('recruitment-', '');
  const pageRequest = request ?? { page: 0, size: 20, search: '', sort: null, columnFilters: {} };
  const params: Record<string, string | number> = {
    page: pageRequest.page,
    size: pageRequest.size,
  };
  if (pageRequest.search) params.search = pageRequest.search;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.department) params.department = filters.department;
  if (id === 'recruitment-interviews' && filters.employeeId) params['column.employeeId'] = filters.employeeId;
  const selectedStatus = id === 'recruitment-applications'
    ? filters.recruitmentStatus
    : id === 'recruitment-jobs' || id === 'recruitment-interviews'
      ? (getFormalReportStatusOptions(id).includes(filters.status) ? filters.status : '')
      : '';
  if (selectedStatus) params.status = selectedStatus;
  if (pageRequest.sort) {
    params.sortBy = pageRequest.sort.key;
    params.sortDir = pageRequest.sort.direction;
  }
  Object.entries(pageRequest.columnFilters).forEach(([key, value]) => {
    if (value.trim()) params[`column.${key}`] = value.trim();
  });

  const response = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/reports/recruitment/${reportType}`, { params });
  const payload = asRecord(unwrapApiData(response.data));
  const columns = recruitmentColumns(id);
  const rows = extractList(payload.rows).map((item) => formatRecruitmentRow(id, asRecord(item)));
  const summaryRecord = asRecord(payload.summary);
  let summary: FormalReportData['summary'] = Object.entries(summaryRecord).map(([label, value]) => ({ label, value: getNumber(value) ?? 0 }));
  if (id === 'recruitment-interviews') {
    const recorded = getNumber(summaryRecord['Recorded outcomes']) ?? 0;
    const successful = getNumber(summaryRecord['Successful outcomes']) ?? 0;
    summary = summary
      .filter((item) => !['Recorded outcomes', 'Successful outcomes'].includes(item.label))
      .concat({ label: 'Interview success rate', value: recorded ? `${Math.round(successful * 1000 / recorded) / 10}%` : 'No data available' });
  }
  const excludedChartLabels = id === 'recruitment-jobs' ? new Set(['Job openings', 'Published']) : new Set([summary[0]?.label]);
  const chartData = summary.filter((item) => !excludedChartLabels.has(item.label)).map((item) => ({ label: item.label, value: Number(item.value), secondaryValue: null, tertiaryValue: null, id: null }));
  const backendCharts = parseSupportingCharts(payload.supportingCharts);
  return {
    title: definition.title,
    description: definition.description,
    columns,
    rows,
    summary,
    supportingCharts: backendCharts.length
      ? backendCharts
      : chartData.length
        ? [chart(`${definition.title} summary`, 'Distribution across the filtered report scope', id === 'recruitment-applications' ? 'horizontalBar' : 'bar', chartData)]
        : [],
    generatedAt: getString(payload.generatedAt) ?? new Date().toISOString(),
    pagination: {
      page: getNumber(payload.page) ?? pageRequest.page,
      size: getNumber(payload.size) ?? pageRequest.size,
      totalElements: getNumber(payload.totalElements) ?? rows.length,
      totalPages: getNumber(payload.totalPages) ?? 1,
    },
  };
}

async function loadNotificationReport(definition: FormalReportDefinition, filters: AnalyticsFilters, request?: FormalReportRequest): Promise<FormalReportData> {
  const pageRequest = request ?? { page: 0, size: 20, search: '', sort: null, columnFilters: {} };
  const params: Record<string, string | number> = { page: pageRequest.page, size: pageRequest.size };
  if (pageRequest.search) params.search = pageRequest.search;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (getFormalReportStatusOptions('notifications').includes(filters.status)) params.status = filters.status;
  if (filters.department) params.department = filters.department;
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.teamId) params.teamId = filters.teamId;
  if (pageRequest.sort) {
    params.sortBy = pageRequest.sort.key;
    params.sortDir = pageRequest.sort.direction;
  }
  Object.entries(pageRequest.columnFilters).forEach(([key, value]) => {
    if (value.trim()) params[`column.${key}`] = value.trim();
  });

  const response = await apiClient.get<ApiResponse<unknown> | unknown>('/api/tenant/reports/notifications', { params });
  const payload = asRecord(unwrapApiData(response.data));
  const rows = extractList(payload.rows).map((item) => {
    const row = asRecord(item);
    return { ...row, created: dateTime(row.created) } as Record<string, ReportCell>;
  });
  const summary = Object.entries(asRecord(payload.summary)).map(([label, value]) => ({
    label,
    value: getNumber(value) ?? getString(value) ?? 'No data available',
  }));
  return {
    title: definition.title,
    description: definition.description,
    columns: [
      { key: 'recipient', label: 'Recipient' },
      { key: 'department', label: 'Department' },
      { key: 'message', label: 'Notification' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'relatedEntityId', label: 'Related entity ID' },
      { key: 'status', label: 'Read status' },
      { key: 'created', label: 'Created' },
    ],
    rows,
    summary,
    supportingCharts: parseSupportingCharts(payload.supportingCharts),
    generatedAt: getString(payload.generatedAt) ?? new Date().toISOString(),
    pagination: {
      page: getNumber(payload.page) ?? pageRequest.page,
      size: getNumber(payload.size) ?? pageRequest.size,
      totalElements: getNumber(payload.totalElements) ?? rows.length,
      totalPages: getNumber(payload.totalPages) ?? 1,
    },
  };
}

function parseSupportingCharts(value: unknown): FormalReportSupportingChart[] {
  const variants = new Set<FormalReportSupportingChart['variant']>(['line', 'bar', 'horizontalBar', 'donut', 'pie']);
  return extractList(value).flatMap((item) => {
    const source = asRecord(item);
    const title = getString(source.title);
    const variant = getString(source.variant) as FormalReportSupportingChart['variant'] | undefined;
    if (!title || !variant || !variants.has(variant)) return [];
    const data = extractList(source.data).flatMap((point) => {
      const record = asRecord(point);
      const label = getString(record.label);
      const pointValue = getNumber(record.value);
      return label && pointValue != null
        ? [{ label, value: pointValue, secondaryValue: null, tertiaryValue: null, id: null }]
        : [];
    });
    return [{ title, subtitle: getString(source.subtitle) ?? '', variant, data }];
  });
}

function recruitmentColumns(id: Extract<FormalReportId, `recruitment-${string}`>): FormalReportColumn[] {
  if (id === 'recruitment-jobs') return [
    { key: 'job', label: 'Job opening' }, { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' },
    { key: 'publishing', label: 'Publishing' }, { key: 'deadline', label: 'Deadline' },
    { key: 'openings', label: 'Openings', align: 'right' }, { key: 'applicants', label: 'Applicants', align: 'right' },
  ];
  if (id === 'recruitment-applications') return [
    { key: 'candidate', label: 'Candidate' }, { key: 'email', label: 'Email' }, { key: 'position', label: 'Position' },
    { key: 'department', label: 'Department' }, { key: 'stage', label: 'Pipeline stage' }, { key: 'source', label: 'Source' }, { key: 'applied', label: 'Applied' },
  ];
  if (id === 'recruitment-interviews') return [
    { key: 'candidate', label: 'Candidate' }, { key: 'position', label: 'Position' }, { key: 'department', label: 'Department' },
    { key: 'interviewer', label: 'Interviewer' }, { key: 'scheduled', label: 'Scheduled' }, { key: 'mode', label: 'Mode' },
    { key: 'status', label: 'Status' }, { key: 'outcome', label: 'Outcome' },
  ];
  return [
    { key: 'candidate', label: 'Candidate' }, { key: 'email', label: 'Email' }, { key: 'position', label: 'Position' },
    { key: 'department', label: 'Department' }, { key: 'hiredAt', label: 'Hired' }, { key: 'employeeId', label: 'Employee ID' },
  ];
}

function formatRecruitmentRow(id: Extract<FormalReportId, `recruitment-${string}`>, row: Record<string, unknown>): Record<string, ReportCell> {
  const formatted = { ...row } as Record<string, ReportCell>;
  if (id === 'recruitment-jobs') formatted.deadline = date(row.deadline);
  if (id === 'recruitment-applications') formatted.applied = dateTime(row.applied);
  if (id === 'recruitment-interviews') formatted.scheduled = dateTime(row.scheduled);
  if (id === 'recruitment-hiring') formatted.hiredAt = dateTime(row.hiredAt);
  return formatted;
}

function applyStructuredFilters(id: FormalReportId, rows: Array<Record<string, ReportCell>>, filters: AnalyticsFilters) {
  const statusOptions = getFormalReportStatusOptions(id);
  return rows.filter((row) => {
    const status = String(firstDefined(row.status, row.stage) ?? '').toUpperCase();
    const department = String(row.department ?? '');
    const recordDate = String(row.recordDate ?? '');
    const projectTeamIds = String(row.teamIdsCsv ?? '').split(',').filter(Boolean);
    const projectEmployeeIds = String(row.employeeIdsCsv ?? '').split(',').filter(Boolean);
    return (!filters.status || !statusOptions.includes(filters.status) || status === filters.status.toUpperCase())
      && (!filters.department || row.department == null || department.trim().toLowerCase() === filters.department.trim().toLowerCase())
      && (!filters.projectId || row.projectId == null || String(row.projectId) === filters.projectId)
      && (id === 'projects'
        ? (!filters.teamId || projectTeamIds.includes(filters.teamId))
        : (!filters.teamId || row.teamId == null || String(row.teamId) === filters.teamId))
      && (id === 'projects'
        ? (!filters.employeeId || projectEmployeeIds.includes(filters.employeeId))
        : (!filters.employeeId || row.employeeId == null || String(row.employeeId) === filters.employeeId))
      && (!filters.leaveType || String(row.type ?? '').toUpperCase() === filters.leaveType.toUpperCase())
      && (!recordDate || recordDate >= filters.fromDate && recordDate <= filters.toDate);
  });
}

export function deriveFormalReport(id: FormalReportId, report: FormalReportData, rows: Array<Record<string, ReportCell>>): FormalReportData {
  return { ...report, rows, summary: buildSummary(id, rows), supportingCharts: buildSupportingCharts(id, rows) };
}

export function reportToDataset(report: FormalReportData, rows = report.rows) {
  return { title: report.title, headers: report.columns.map((column) => column.label), rows: rows.map((row) => report.columns.map((column) => row[column.key])) };
}

function buildSummary(id: FormalReportId, rows: Array<Record<string, ReportCell>>): Array<{ label: string; value: string | number }> {
  const status = (value: string) => rows.filter((row) => String(row.status ?? row.stage ?? '').toUpperCase() === value).length;
  const distinct = (key: string) => new Set(rows.map((row) => String(row[key] ?? '')).filter(Boolean)).size;
  const sum = (key: string) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const avg = (key: string) => rows.length ? Math.round(sum(key) * 10 / rows.length) / 10 : 0;
  if (['employees', 'new-joiners', 'employee-status'].includes(id)) return [{ label: 'Total employees', value: rows.length }, { label: 'Active', value: status('ACTIVE') }, { label: 'Inactive', value: status('INACTIVE') }, { label: 'Departments', value: distinct('department') }];
  if (id === 'attendance') return [{ label: 'Present', value: status('PRESENT') }, { label: 'Late', value: rows.filter((row) => row.late === 'Yes').length }, { label: 'Absent', value: status('ABSENT') }, { label: 'Average minutes', value: avg('worked') }];
  if (id === 'leave') return [{ label: 'Pending', value: status('PENDING') }, { label: 'Approved', value: status('APPROVED') }, { label: 'Rejected', value: status('REJECTED') }, { label: 'Cancelled', value: status('CANCELLED') }];
  if (id === 'projects') {
    const completed = status('COMPLETED');
    return [
      { label: 'Projects', value: rows.length },
      { label: 'Active', value: status('IN_PROGRESS') },
      { label: 'Completed', value: completed },
      { label: 'Completion rate', value: rows.length ? `${Math.round(completed * 1000 / rows.length) / 10}%` : 'No data available' },
    ];
  }
  if (id === 'tasks') return [{ label: 'Completed', value: status('DONE') }, { label: 'Overdue', value: rows.filter((row) => Boolean(row.recordDate) && String(row.recordDate) < new Date().toISOString().slice(0, 10) && String(row.status).toUpperCase() !== 'DONE').length }, { label: 'Blocked', value: status('BLOCKED') }, { label: 'High priority', value: rows.filter((row) => ['HIGH', 'CRITICAL'].includes(String(row.priority).toUpperCase())).length }];
  if (id === 'teams') return [{ label: 'Teams', value: rows.length }, { label: 'Members', value: sum('members') }, { label: 'Average team size', value: avg('members') }, { label: 'Managed teams', value: rows.filter((row) => row.manager !== '—').length }];
  if (id === 'audit') return [{ label: 'Audit events', value: rows.length }, { label: 'Creates', value: rows.filter((row) => row.action === 'CREATE').length }, { label: 'Updates', value: rows.filter((row) => row.action === 'UPDATE').length }, { label: 'Actors', value: distinct('actor') }];
  if (id === 'notifications') return [{ label: 'Notifications', value: rows.length }, { label: 'Unread', value: status('UNREAD') }, { label: 'Read', value: status('READ') }, { label: 'Types', value: distinct('type') }];
  if (id === 'departments') return [{ label: 'Departments', value: rows.length }, { label: 'Employees', value: sum('employees') }, { label: 'Largest department', value: String(rows.reduce<Record<string, ReportCell>>((best, row) => Number(row.employees) > Number(best.employees ?? 0) ? row : best, {}).department ?? '—') }, { label: 'Average size', value: avg('employees') }];
  if (id === 'project-progress') return [{ label: 'Projects', value: rows.length }, { label: 'Average completion', value: `${Math.round(rows.reduce((total, row) => total + Number(String(row.value).replace('%', '')), 0) / Math.max(1, rows.length))}%` }, { label: 'At risk', value: rows.filter((row) => Number(String(row.value).replace('%', '')) < 50).length }, { label: 'Healthy', value: rows.filter((row) => Number(String(row.value).replace('%', '')) >= 75).length }];
  if (id === 'workload') return [{ label: 'Employees', value: rows.length }, { label: 'Assignments', value: sum('value') }, { label: 'Average workload', value: avg('value') }, { label: 'Highest workload', value: Math.max(0, ...rows.map((row) => Number(row.value) || 0)) }];
  if (id === 'system-health') return [{ label: 'Risk signals', value: rows.length }, { label: 'Critical signals', value: rows.filter((row) => row.severity === 'CRITICAL').length }, { label: 'Warning signals', value: rows.filter((row) => row.severity === 'WARNING').length }, { label: 'Total impact', value: sum('count') }];
  return rows.slice(0, 4).map((row) => ({ label: String(row.indicator ?? 'Indicator'), value: String(row.value ?? '—') }));
}

function buildSupportingCharts(id: FormalReportId, rows: Array<Record<string, ReportCell>>): FormalReportSupportingChart[] {
  const statusOrder = ['PLANNED', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'PENDING', 'ON_HOLD', 'BLOCKED', 'ACTIVE', 'APPROVED', 'COMPLETED', 'DONE', 'INACTIVE', 'CANCELLED', 'REJECTED', 'CRITICAL', 'WARNING'];
  const group = (key: string, valueKey?: string, sourceRows = rows) => {
    const counts = new Map<string, number>();
    sourceRows.forEach((row) => { const label = String(row[key] ?? 'Unspecified'); counts.set(label, (counts.get(label) ?? 0) + (valueKey ? Number(row[valueKey]) || 0 : 1)); });
    return [...counts.entries()].map(([label, value]) => ({ label, value, secondaryValue: null, tertiaryValue: null, id: null })).sort((a, b) => {
      if (key === 'status' || key === 'severity') {
        const left = statusOrder.indexOf(a.label); const right = statusOrder.indexOf(b.label);
        return (left < 0 ? Number.MAX_SAFE_INTEGER : left) - (right < 0 ? Number.MAX_SAFE_INTEGER : right);
      }
      return b.value - a.value || a.label.localeCompare(b.label);
    }).slice(0, 10);
  };
  const direct = (labelKey: string, valueKey: string, sourceRows = rows) => sourceRows.map((row) => ({ label: String(row[labelKey] ?? 'Unspecified'), value: Number(String(row[valueKey] ?? 0).replace(/[^0-9.-]/g, '')) || 0, secondaryValue: null, tertiaryValue: null, id: null })).sort((a, b) => b.value - a.value).slice(0, 10);
  const trend = (dateKey = 'recordDate', sourceRows = rows) => {
    const counts = new Map<string, number>();
    sourceRows.forEach((row) => { const value = String(row[dateKey] ?? '').slice(0, 7); if (value) counts.set(value, (counts.get(value) ?? 0) + 1); });
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, value]) => ({ label, value, secondaryValue: null, tertiaryValue: null, id: null }));
  };
  if (['employees', 'new-joiners', 'employee-status'].includes(id)) return [chart('Department distribution', 'Employees by department', 'donut', group('department')), chart('Employees by role', 'Workforce by application role', 'bar', group('role')), chart('Employee status', 'Active and inactive workforce', 'donut', group('status')), chart('Joining trend', 'Employees joining by month', 'line', trend())];
  if (id === 'attendance') return [chart('Attendance status', 'Mutually exclusive attendance outcomes', 'donut', group('status')), chart('Monthly attendance', 'Attendance records by month', 'line', trend())];
  if (id === 'leave') return [chart('Leave utilization', 'Requests by leave type', 'donut', group('type')), chart('Decision status', 'Approval workflow outcomes', 'donut', group('status')), chart('Monthly leave requests', 'Requests starting in each month', 'line', trend())];
  if (id === 'projects') {
    const priorityRows = rows.filter((row) => String(row.priority ?? '').trim());
    const healthRows = rows.filter((row) => Number(row.taskTotal) > 0);
    const projectHealth = healthRows.map((row) => ({
      label: String(row.name ?? ''),
      value: Number(row.completionRate) || 0,
      secondaryValue: null,
      tertiaryValue: null,
      id: null,
    })).sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
    const activeCompleted = ['IN_PROGRESS', 'COMPLETED'].map((label) => ({
      label,
      value: rows.filter((row) => row.status === label).length,
      secondaryValue: null,
      tertiaryValue: null,
      id: null,
    })).filter((item) => item.value > 0);
    return [
      chart('Projects by Status', 'Projects grouped by exact database status', 'donut', group('status')),
      chart('Projects by Priority', 'Highest recorded task priority for each project with tasks', 'bar', group('priority', undefined, priorityRows)),
      chart('Project Timeline', 'Projects grouped by planned start month', 'line', trend('startRaw', rows)),
      chart('Project Health', 'Completed tasks divided by total scoped tasks for each project', 'horizontalBar', projectHealth),
      chart('Active vs Completed', 'In-progress and completed project comparison', 'bar', activeCompleted),
      chart('Monthly Project Creation', 'Projects created in each month', 'line', trend('recordDate', rows)),
    ];
  }
  if (id === 'tasks') return [chart('Task status', 'Work by workflow state', 'donut', group('status')), chart('Priority distribution', 'Tasks by urgency', 'bar', group('priority'))];
  if (id === 'teams') return [chart('Members per team', 'Active team size comparison', 'horizontalBar', direct('name', 'members'))];
  if (id === 'audit') return [chart('Audit actions', 'Events by action type', 'bar', group('action')), chart('Audited entities', 'Events by entity type', 'horizontalBar', group('entity'))];
  if (id === 'notifications') return [chart('Read status', 'Read compared with unread', 'donut', group('status')), chart('Notification types', 'Messages by notification type', 'bar', group('type'))];
  if (id === 'departments') return [chart('Department workforce', 'Employees per department', 'horizontalBar', direct('department', 'employees'))];
  if (id === 'project-progress') return [chart('Project completion', 'Completion percentage by project', 'horizontalBar', direct('name', 'value'))];
  if (id === 'workload') return [chart('Resource workload', 'Assignments by employee', 'horizontalBar', direct('name', 'value'))];
  if (id === 'system-health') return [chart('Risk severity', 'Operational risk signals by severity', 'donut', group('severity'))];
  if (id === 'organization') return [];
  return [];
}

function chart(title: string, subtitle: string, variant: FormalReportSupportingChart['variant'], data: FormalReportSupportingChart['data']): FormalReportSupportingChart { return { title, subtitle, variant, data }; }
