import { describe, expect, it } from 'vitest';
import { getReportCatalog } from '@/modules/analytics/formalReports';

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
});
