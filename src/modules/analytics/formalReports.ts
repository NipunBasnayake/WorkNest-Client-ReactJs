import type { AnalyticsFilters } from '@/modules/analytics/types';
import type { NormalizedAppRole } from '@/constants/rolePermissionMap';
import type { ReportCell } from '@/modules/analytics/reportExport';
import { getEmployees } from '@/modules/employees/services/employeeService';
import { getAttendanceRecords } from '@/modules/attendance/services/attendanceService';
import { getLeaveRequests } from '@/modules/leave/services/leaveService';
import { getProjects } from '@/modules/projects/services/projectService';
import { getTasks } from '@/modules/tasks/services/taskService';
import { getTeams } from '@/modules/teams/services/teamService';
import { getNotifications } from '@/modules/notifications/services/notificationService';
import { getApplications, getInterviews } from '@/modules/recruitment/services/recruitmentService';
import { getAuditLogs } from '@/modules/audit/services/auditLogService';
import { getBusinessIntelligenceReport, getTenantAnalyticsData } from '@/modules/analytics/services/analyticsService';
import { asRecord, firstDefined, getNumber, getString } from '@/services/http/parsers';

export type FormalReportId = 'employees' | 'attendance' | 'leave' | 'projects' | 'tasks' | 'recruitment' | 'teams' | 'audit' | 'notifications' | 'organization' | 'system-health' | 'departments' | 'new-joiners' | 'employee-status' | 'interviews' | 'project-progress' | 'workload';
export interface FormalReportDefinition { id: FormalReportId; title: string; description: string; group: string; }
export interface FormalReportColumn { key: string; label: string; align?: 'left' | 'right'; }
export interface FormalReportSupportingChart { title: string; subtitle: string; variant: 'bar' | 'horizontalBar' | 'donut' | 'pie'; data: Array<{ label: string; value: number; secondaryValue: null; tertiaryValue: null; id: null }>; }
export interface FormalReportData { title: string; description: string; columns: FormalReportColumn[]; rows: Array<Record<string, ReportCell>>; summary: Array<{ label: string; value: string | number }>; supportingCharts: FormalReportSupportingChart[]; generatedAt: string; }

const definitions: Record<FormalReportId, FormalReportDefinition> = {
  employees: { id: 'employees', title: 'Employee Report', description: 'Auditable employee directory, role, department, status, and joining information.', group: 'People' },
  attendance: { id: 'attendance', title: 'Attendance Report', description: 'Daily attendance records with check-in, check-out, lateness, and work status.', group: 'People' },
  leave: { id: 'leave', title: 'Leave Report', description: 'Leave requests, utilization dates, decision status, and employee ownership.', group: 'People' },
  projects: { id: 'projects', title: 'Project Report', description: 'Portfolio register with ownership, schedule, and delivery status.', group: 'Delivery' },
  tasks: { id: 'tasks', title: 'Task Report', description: 'Detailed work register for assignments, priorities, deadlines, and workflow status.', group: 'Delivery' },
  recruitment: { id: 'recruitment', title: 'Recruitment Report', description: 'Candidate applications by position, pipeline stage, and application date.', group: 'Talent' },
  teams: { id: 'teams', title: 'Team Report', description: 'Team register with management ownership and active membership.', group: 'Organization' },
  audit: { id: 'audit', title: 'Audit Report', description: 'Governance-ready history of actors, actions, entities, and timestamps.', group: 'Governance' },
  notifications: { id: 'notifications', title: 'Notification Report', description: 'Notification delivery and read-status register for the current administrator.', group: 'System' },
  organization: { id: 'organization', title: 'Organization Summary', description: 'Formal company KPI statement for the selected reporting period.', group: 'Executive' },
  'system-health': { id: 'system-health', title: 'System Health Report', description: 'Operational warnings, communication volume, and system risk statement.', group: 'System' },
  departments: { id: 'departments', title: 'Department Report', description: 'Department-level workforce totals for capacity review.', group: 'People' },
  'new-joiners': { id: 'new-joiners', title: 'New Joiners Report', description: 'Employees who joined within the selected reporting period.', group: 'People' },
  'employee-status': { id: 'employee-status', title: 'Employee Status Report', description: 'Employee account and employment status register.', group: 'People' },
  interviews: { id: 'interviews', title: 'Interview Report', description: 'Interview schedule, candidate, interviewer, mode, and outcome status.', group: 'Talent' },
  'project-progress': { id: 'project-progress', title: 'Project Progress Report', description: 'Project completion statement based on completed and total work.', group: 'Delivery' },
  workload: { id: 'workload', title: 'Workload Report', description: 'Assigned work totals by employee for resource planning.', group: 'Delivery' },
};

export function getReportCatalog(role: NormalizedAppRole | null): FormalReportDefinition[] {
  const ids: FormalReportId[] = role === 'TENANT_ADMIN'
    ? ['employees', 'attendance', 'leave', 'projects', 'tasks', 'recruitment', 'teams', 'audit', 'notifications', 'organization', 'system-health']
    : role === 'HR'
      ? ['employees', 'attendance', 'leave', 'recruitment', 'departments', 'new-joiners', 'employee-status', 'interviews']
      : role === 'MANAGER'
        ? ['teams', 'project-progress', 'tasks', 'workload']
        : [];
  return ids.map((id) => definitions[id]);
}

const text = (value: unknown, fallback = '—') => getString(value) ?? fallback;
const date = (value: unknown) => { const raw = getString(value); return raw ? new Date(raw).toLocaleDateString() : '—'; };
const dateTime = (value: unknown) => { const raw = getString(value); return raw ? new Date(raw).toLocaleString() : '—'; };
const daysBetween = (start: unknown, end: unknown) => { const from = getString(start); const to = getString(end); if (!from || !to) return '—'; return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1); };

export async function loadFormalReport(id: FormalReportId, filters: AnalyticsFilters, role: NormalizedAppRole): Promise<FormalReportData> {
  const definition = definitions[id];
  let columns: FormalReportColumn[] = [];
  let rows: Array<Record<string, ReportCell>> = [];
  if (id === 'employees' || id === 'new-joiners' || id === 'employee-status') {
    const items = await getEmployees();
    columns = [{ key: 'code', label: 'Employee ID' }, { key: 'name', label: 'Employee' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'role', label: 'Role' }, { key: 'joined', label: 'Joined' }, { key: 'status', label: 'Status' }];
    rows = items.map((item) => ({ code: text(item.employeeCode), name: text(item.name), email: text(item.email), department: text(item.department), designation: text(item.designation ?? item.position), role: text(item.role), joined: date(item.joinedDate ?? item.joinedAt), joinedRaw: text(item.joinedDate ?? item.joinedAt, ''), status: text(item.status) }));
    if (id === 'new-joiners') rows = rows.filter((item) => String(item.joinedRaw) >= filters.fromDate && String(item.joinedRaw) <= filters.toDate);
  } else if (id === 'attendance') {
    const items = await getAttendanceRecords(filters.toDate, role === 'TENANT_ADMIN' || role === 'HR' ? 'all' : 'mine');
    columns = [{ key: 'date', label: 'Date' }, { key: 'employee', label: 'Employee' }, { key: 'checkIn', label: 'Check in' }, { key: 'checkOut', label: 'Check out' }, { key: 'status', label: 'Status' }, { key: 'late', label: 'Late' }, { key: 'worked', label: 'Worked minutes', align: 'right' }];
    rows = items.map((item) => ({ date: date(item.date), recordDate: text(item.date, ''), employee: item.employeeName, checkIn: dateTime(item.checkIn), checkOut: dateTime(item.checkOut), status: item.status, late: item.late ? 'Yes' : 'No', worked: item.workedMinutes ?? '—' }));
  } else if (id === 'leave') {
    const items = await getLeaveRequests();
    columns = [{ key: 'employee', label: 'Employee' }, { key: 'type', label: 'Leave type' }, { key: 'start', label: 'Start' }, { key: 'end', label: 'End' }, { key: 'days', label: 'Days', align: 'right' }, { key: 'status', label: 'Status' }, { key: 'reason', label: 'Reason' }];
    rows = items.map((item) => ({ employee: text(item.employeeName), type: text(item.leaveType), start: date(item.startDate), end: date(item.endDate), recordDate: text(item.startDate, ''), days: daysBetween(item.startDate, item.endDate), status: text(item.status), reason: text(item.reason) }));
  } else if (id === 'projects') {
    const items = await getProjects();
    columns = [{ key: 'name', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'start', label: 'Start date' }, { key: 'end', label: 'End date' }, { key: 'owner', label: 'Created by' }, { key: 'description', label: 'Description' }];
    rows = items.map((item) => ({ name: item.name, status: item.status, start: date(item.startDate), end: date(item.endDate), recordDate: text(item.startDate, ''), owner: text(firstDefined(asRecord(item).createdByName, asRecord(asRecord(item).createdBy).name)), description: text(item.description) }));
  } else if (id === 'tasks') {
    const items = await getTasks();
    columns = [{ key: 'title', label: 'Task' }, { key: 'project', label: 'Project' }, { key: 'team', label: 'Team' }, { key: 'assignee', label: 'Assignee' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'due', label: 'Due date' }];
    rows = items.map((item) => ({ title: item.title, project: text(item.projectName), team: text(item.assignedTeamName), assignee: text(item.assigneeName), priority: item.priority, status: item.status, due: date(item.dueDate), recordDate: text(item.dueDate, '') }));
  } else if (id === 'recruitment') {
    const result = await getApplications();
    columns = [{ key: 'candidate', label: 'Candidate' }, { key: 'email', label: 'Email' }, { key: 'position', label: 'Position' }, { key: 'department', label: 'Department' }, { key: 'stage', label: 'Pipeline stage' }, { key: 'applied', label: 'Applied' }];
    rows = result.items.map((item) => ({ candidate: item.candidate.fullName, email: item.candidate.email, position: item.jobPosition.title, department: text(item.jobPosition.department), stage: item.status, applied: dateTime(item.appliedAt), recordDate: text(item.appliedAt, '').slice(0, 10) }));
  } else if (id === 'interviews') {
    const items = await getInterviews();
    columns = [{ key: 'candidate', label: 'Candidate' }, { key: 'position', label: 'Position' }, { key: 'interviewer', label: 'Interviewer' }, { key: 'scheduled', label: 'Scheduled' }, { key: 'mode', label: 'Mode' }, { key: 'status', label: 'Status' }];
    rows = items.map((item) => ({ candidate: item.candidate.fullName, position: item.jobPosition.title, interviewer: text(item.interviewer?.name), scheduled: dateTime(item.scheduledAt), recordDate: text(item.scheduledAt, '').slice(0, 10), mode: text(item.mode), status: text(item.status) }));
  } else if (id === 'teams') {
    const items = await getTeams();
    columns = [{ key: 'name', label: 'Team' }, { key: 'manager', label: 'Manager' }, { key: 'members', label: 'Members', align: 'right' }, { key: 'description', label: 'Description' }];
    rows = items.map((item) => ({ name: item.name, manager: text(item.managerName), members: getNumber(asRecord(item).memberCount) ?? 0, description: text(item.description) }));
  } else if (id === 'audit') {
    const result = await getAuditLogs({ fromDate: `${filters.fromDate}T00:00:00`, toDate: `${filters.toDate}T23:59:59`, size: 200 });
    columns = [{ key: 'time', label: 'Timestamp' }, { key: 'actor', label: 'Actor' }, { key: 'action', label: 'Action' }, { key: 'entity', label: 'Entity type' }, { key: 'entityId', label: 'Entity ID' }];
    rows = result.items.map((item) => ({ time: dateTime(item.createdAt), recordDate: text(item.createdAt, '').slice(0, 10), actor: text(item.actorEmail), action: item.action, entity: item.entityType, entityId: item.entityId ?? '—' }));
  } else if (id === 'notifications') {
    const items = await getNotifications();
    columns = [{ key: 'time', label: 'Created' }, { key: 'title', label: 'Notification' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Read status' }];
    rows = items.map((item) => ({ time: dateTime(item.createdAt), recordDate: text(item.createdAt, '').slice(0, 10), title: item.title, type: text(item.type), status: item.read ? 'Read' : 'Unread' }));
  } else if (id === 'departments' || id === 'organization' || id === 'system-health') {
    const bi = await getBusinessIntelligenceReport(filters);
    if (id === 'departments') { columns = [{ key: 'department', label: 'Department' }, { key: 'employees', label: 'Employees', align: 'right' }]; rows = (bi.charts.employeesByDepartment ?? []).map((item) => ({ department: item.label, employees: item.value })); }
    else if (id === 'organization') { columns = [{ key: 'indicator', label: 'Indicator' }, { key: 'value', label: 'Value', align: 'right' }, { key: 'context', label: 'Reporting context' }]; rows = bi.kpis.map((item) => ({ indicator: item.label, value: `${item.value}${item.unit}`, context: item.context })); }
    else { columns = [{ key: 'severity', label: 'Severity' }, { key: 'risk', label: 'Risk indicator' }, { key: 'count', label: 'Count', align: 'right' }, { key: 'recommendation', label: 'Recommended action' }]; rows = bi.risks.map((item) => ({ severity: item.severity.toUpperCase(), risk: item.title, count: item.count, recommendation: item.description })); }
  } else if (id === 'project-progress' || id === 'workload') {
    const analytics = await getTenantAnalyticsData(filters);
    const items = id === 'project-progress' ? analytics.projectProgress : analytics.workloadByEmployee;
    columns = id === 'project-progress' ? [{ key: 'name', label: 'Project' }, { key: 'value', label: 'Completion', align: 'right' }] : [{ key: 'name', label: 'Employee' }, { key: 'value', label: 'Assigned tasks', align: 'right' }];
    rows = items.map((item) => ({ name: item.label, value: id === 'project-progress' ? `${item.value}%` : item.value }));
  }
  rows = applyStructuredFilters(rows, filters);
  return { title: definition.title, description: definition.description, columns, rows, summary: buildSummary(id, rows), supportingCharts: buildSupportingCharts(id, rows), generatedAt: new Date().toISOString() };
}

function applyStructuredFilters(rows: Array<Record<string, ReportCell>>, filters: AnalyticsFilters) {
  return rows.filter((row) => {
    const status = String(firstDefined(row.status, row.stage) ?? '');
    const department = String(row.department ?? '');
    const recordDate = String(row.recordDate ?? '');
    return (!filters.status || status === filters.status)
      && (!filters.recruitmentStatus || status === filters.recruitmentStatus)
      && (!filters.department || department === filters.department)
      && (!filters.leaveType || String(row.type ?? '') === filters.leaveType)
      && (!recordDate || recordDate >= filters.fromDate && recordDate <= filters.toDate);
  });
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
  if (id === 'projects') return [{ label: 'Projects', value: rows.length }, { label: 'Active', value: status('IN_PROGRESS') }, { label: 'Completed', value: status('COMPLETED') }, { label: 'On hold', value: status('ON_HOLD') }];
  if (id === 'tasks') return [{ label: 'Completed', value: status('DONE') }, { label: 'Overdue', value: rows.filter((row) => String(row.recordDate ?? '') < new Date().toISOString().slice(0, 10) && row.status !== 'DONE').length }, { label: 'Blocked', value: status('BLOCKED') }, { label: 'High priority', value: rows.filter((row) => ['HIGH', 'CRITICAL'].includes(String(row.priority))).length }];
  if (id === 'recruitment') return [{ label: 'Applications', value: rows.length }, { label: 'Interviews', value: status('INTERVIEW') }, { label: 'Offers', value: status('OFFERED') }, { label: 'Hired', value: status('HIRED') }];
  if (id === 'interviews') return [{ label: 'Interviews', value: rows.length }, { label: 'Scheduled', value: status('SCHEDULED') }, { label: 'Completed', value: status('COMPLETED') }, { label: 'Cancelled', value: status('CANCELLED') }];
  if (id === 'teams') return [{ label: 'Teams', value: rows.length }, { label: 'Members', value: sum('members') }, { label: 'Average team size', value: avg('members') }, { label: 'Managed teams', value: rows.filter((row) => row.manager !== '—').length }];
  if (id === 'audit') return [{ label: 'Audit events', value: rows.length }, { label: 'Creates', value: rows.filter((row) => row.action === 'CREATE').length }, { label: 'Updates', value: rows.filter((row) => row.action === 'UPDATE').length }, { label: 'Actors', value: distinct('actor') }];
  if (id === 'notifications') return [{ label: 'Notifications', value: rows.length }, { label: 'Unread', value: status('UNREAD') }, { label: 'Read', value: status('READ') }, { label: 'Types', value: distinct('type') }];
  if (id === 'departments') return [{ label: 'Departments', value: rows.length }, { label: 'Employees', value: sum('employees') }, { label: 'Largest department', value: String(rows.reduce<Record<string, ReportCell>>((best, row) => Number(row.employees) > Number(best.employees ?? 0) ? row : best, {}).department ?? '—') }, { label: 'Average size', value: avg('employees') }];
  if (id === 'project-progress') return [{ label: 'Projects', value: rows.length }, { label: 'Average completion', value: `${Math.round(rows.reduce((total, row) => total + Number(String(row.value).replace('%', '')), 0) / Math.max(1, rows.length))}%` }, { label: 'At risk', value: rows.filter((row) => Number(String(row.value).replace('%', '')) < 50).length }, { label: 'Healthy', value: rows.filter((row) => Number(String(row.value).replace('%', '')) >= 75).length }];
  if (id === 'workload') return [{ label: 'Employees', value: rows.length }, { label: 'Assignments', value: sum('value') }, { label: 'Average workload', value: avg('value') }, { label: 'Highest workload', value: Math.max(0, ...rows.map((row) => Number(row.value) || 0)) }];
  if (id === 'system-health') return [{ label: 'Risk signals', value: rows.length }, { label: 'Critical', value: rows.filter((row) => row.severity === 'CRITICAL').length }, { label: 'Warnings', value: rows.filter((row) => row.severity === 'WARNING').length }, { label: 'Total affected', value: sum('count') }];
  return rows.slice(0, 4).map((row) => ({ label: String(row.indicator ?? 'Indicator'), value: String(row.value ?? '—') }));
}

function buildSupportingCharts(id: FormalReportId, rows: Array<Record<string, ReportCell>>): FormalReportSupportingChart[] {
  const group = (key: string) => {
    const counts = new Map<string, number>();
    rows.forEach((row) => { const label = String(row[key] ?? 'Unspecified'); counts.set(label, (counts.get(label) ?? 0) + 1); });
    return [...counts.entries()].map(([label, value]) => ({ label, value, secondaryValue: null, tertiaryValue: null, id: null })).sort((a, b) => b.value - a.value).slice(0, 10);
  };
  const direct = (labelKey: string, valueKey: string) => rows.map((row) => ({ label: String(row[labelKey] ?? 'Unspecified'), value: Number(String(row[valueKey] ?? 0).replace(/[^0-9.-]/g, '')) || 0, secondaryValue: null, tertiaryValue: null, id: null })).sort((a, b) => b.value - a.value).slice(0, 10);
  if (['employees', 'new-joiners', 'employee-status'].includes(id)) return [chart('Department distribution', 'Employees by department', 'donut', group('department')), chart('Employee status', 'Active and inactive workforce', 'bar', group('status'))];
  if (id === 'attendance') return [chart('Attendance status', 'Daily status distribution', 'donut', group('status')), chart('Late arrivals', 'On-time compared with late records', 'bar', group('late'))];
  if (id === 'leave') return [chart('Leave utilization', 'Requests by leave type', 'donut', group('type')), chart('Decision status', 'Approval workflow outcomes', 'bar', group('status'))];
  if (id === 'projects') return [chart('Project status', 'Portfolio by delivery status', 'donut', group('status'))];
  if (id === 'tasks') return [chart('Task status', 'Work by workflow state', 'donut', group('status')), chart('Priority distribution', 'Tasks by urgency', 'bar', group('priority'))];
  if (id === 'recruitment') return [chart('Recruitment pipeline', 'Applications by stage', 'horizontalBar', group('stage')), chart('Applications by department', 'Talent demand by function', 'bar', group('department'))];
  if (id === 'interviews') return [chart('Interview status', 'Scheduled interview outcomes', 'donut', group('status')), chart('Interview mode', 'Interview delivery channels', 'bar', group('mode'))];
  if (id === 'teams') return [chart('Members per team', 'Active team size comparison', 'horizontalBar', direct('name', 'members'))];
  if (id === 'audit') return [chart('Audit actions', 'Events by action type', 'bar', group('action')), chart('Audited entities', 'Events by entity type', 'horizontalBar', group('entity'))];
  if (id === 'notifications') return [chart('Read status', 'Read compared with unread', 'donut', group('status')), chart('Notification types', 'Messages by notification type', 'bar', group('type'))];
  if (id === 'departments') return [chart('Department workforce', 'Employees per department', 'horizontalBar', direct('department', 'employees'))];
  if (id === 'project-progress') return [chart('Project completion', 'Completion percentage by project', 'horizontalBar', direct('name', 'value'))];
  if (id === 'workload') return [chart('Resource workload', 'Assignments by employee', 'horizontalBar', direct('name', 'value'))];
  if (id === 'system-health') return [chart('Risk severity', 'Operational risks by severity', 'donut', group('severity'))];
  if (id === 'organization') return [chart('Organization indicators', 'Selected executive KPI statement', 'bar', direct('indicator', 'value'))];
  return [];
}

function chart(title: string, subtitle: string, variant: FormalReportSupportingChart['variant'], data: FormalReportSupportingChart['data']): FormalReportSupportingChart { return { title, subtitle, variant, data }; }
