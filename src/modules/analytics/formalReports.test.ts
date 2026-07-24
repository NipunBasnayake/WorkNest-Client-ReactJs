import { describe, expect, it } from 'vitest';
import { deriveFormalReport, getFormalReportStatusOptions, getReportCatalog, type FormalReportData } from '@/modules/analytics/formalReports';

describe('formal report catalog', () => {
  it('gives tenant administrators the governance and system reports', () => {
    const ids = getReportCatalog('TENANT_ADMIN').map((item) => item.id);
    expect(ids).toContain('audit');
    expect(ids).toContain('organization');
    expect(ids).toContain('system-health');
  });

  it('keeps HR and Manager report responsibilities distinct', () => {
    const hr = getReportCatalog('HR').map((item) => item.id);
    const manager = getReportCatalog('MANAGER').map((item) => item.id);
    expect(hr).toContain('new-joiners');
    expect(hr).toEqual(expect.arrayContaining([
      'recruitment-jobs',
      'recruitment-applications',
      'recruitment-interviews',
      'recruitment-hiring',
    ]));
    expect(manager).toEqual(['teams', 'project-progress', 'tasks', 'workload']);
  });

  it('does not expose formal company reports to employees', () => {
    expect(getReportCatalog('EMPLOYEE')).toEqual([]);
  });

  it('recalculates employee summaries and charts from the filtered table rows', () => {
    const report: FormalReportData = {
      title: 'Employee Report', description: '', generatedAt: '2026-07-01T00:00:00Z',
      columns: [{ key: 'name', label: 'Employee' }],
      rows: [], summary: [], supportingCharts: [],
    };
    const rows = [
      { name: 'Ada', department: 'Engineering', role: 'EMPLOYEE', status: 'ACTIVE', recordDate: '2026-05-01' },
      { name: 'Grace', department: 'People', role: 'HR', status: 'ACTIVE', recordDate: '2026-06-01' },
    ];

    const filtered = deriveFormalReport('employees', report, rows.slice(0, 1));

    expect(filtered.summary).toContainEqual({ label: 'Total employees', value: 1 });
    expect(filtered.supportingCharts.find((chart) => chart.title === 'Department distribution')?.data).toEqual([
      expect.objectContaining({ label: 'Engineering', value: 1 }),
    ]);
  });

  it('sums risk signals by severity without treating impact counts as chart slices', () => {
    const report: FormalReportData = { title: 'System Health Report', description: '', generatedAt: '2026-07-01T00:00:00Z', columns: [], rows: [], summary: [], supportingCharts: [] };
    const derived = deriveFormalReport('system-health', report, [
      { severity: 'CRITICAL', count: 8 }, { severity: 'CRITICAL', count: 3 }, { severity: 'WARNING', count: 5 },
    ]);

    expect(derived.summary).toContainEqual({ label: 'Critical signals', value: 2 });
    expect(derived.supportingCharts[0].data).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'CRITICAL', value: 2 }),
      expect.objectContaining({ label: 'WARNING', value: 1 }),
    ]));
  });

  it('uses report-specific status filters', () => {
    expect(getFormalReportStatusOptions('tasks')).toEqual(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE']);
    expect(getFormalReportStatusOptions('recruitment-interviews')).toContain('RESCHEDULED');
    expect(getFormalReportStatusOptions('organization')).toEqual([]);
  });

  it('derives every project metric from the filtered project rows and real task totals', () => {
    const report: FormalReportData = {
      title: 'Project Report', description: '', generatedAt: '2026-07-01T00:00:00Z',
      columns: [], rows: [], summary: [], supportingCharts: [],
    };
    const rows = [
      {
        name: 'Atlas', status: 'IN_PROGRESS', priority: 'CRITICAL',
        taskTotal: 4, taskDone: 3, completionRate: 75,
        startRaw: '2026-05-10', recordDate: '2026-04-01',
      },
      {
        name: 'Beacon', status: 'COMPLETED', priority: 'LOW',
        taskTotal: 2, taskDone: 2, completionRate: 100,
        startRaw: '2026-06-15', recordDate: '2026-05-02',
      },
    ];

    const derived = deriveFormalReport('projects', report, rows);

    expect(derived.summary).toContainEqual({ label: 'Completion rate', value: '50%' });
    const statusChart = derived.supportingCharts.find((chart) => chart.title === 'Projects by Status');
    expect(statusChart?.variant).toBe('donut');
    expect(statusChart?.data.reduce((total, point) => total + point.value, 0)).toBe(rows.length);
    expect(statusChart?.data.map((point) => point.label)).toEqual(['IN_PROGRESS', 'COMPLETED']);
    expect(derived.supportingCharts.find((chart) => chart.title === 'Projects by Priority')?.data)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ label: 'CRITICAL', value: 1 }),
        expect.objectContaining({ label: 'LOW', value: 1 }),
      ]));
    expect(derived.supportingCharts.find((chart) => chart.title === 'Project Health')?.data)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ label: 'Atlas', value: 75 }),
        expect.objectContaining({ label: 'Beacon', value: 100 }),
      ]));
  });

  it('returns no project percentages or chart slices for an empty filtered dataset', () => {
    const report: FormalReportData = {
      title: 'Project Report', description: '', generatedAt: '2026-07-01T00:00:00Z',
      columns: [], rows: [], summary: [], supportingCharts: [],
    };

    const derived = deriveFormalReport('projects', report, []);

    expect(derived.summary).toContainEqual({ label: 'Completion rate', value: 'No data available' });
    expect(derived.supportingCharts.every((chart) => chart.data.length === 0)).toBe(true);
  });
});
