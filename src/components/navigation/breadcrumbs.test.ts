import { describe, expect, it } from 'vitest';
import { buildBreadcrumbItems } from '@/components/navigation/breadcrumbs';

describe('automatic breadcrumbs', () => {
  it('links a deep tenant hierarchy and marks the current page', () => {
    expect(buildBreadcrumbItems({
      area: 'tenant', pathname: '/residue/recruitment/applications/42', tenantSlug: 'residue',
      labels: ['Workspace', 'Recruitment', 'Applications', 'Review'],
    })).toEqual([
      { label: 'Workspace', to: '/residue/dashboard', current: false },
      { label: 'Recruitment', to: '/residue/recruitment/jobs', current: false },
      { label: 'Applications', to: '/residue/recruitment/applications', current: false },
      { label: 'Review', to: '/residue/recruitment/applications/42', current: true },
    ]);
  });

  it('distinguishes the settings profile from the top-level profile', () => {
    const items = buildBreadcrumbItems({ area: 'tenant', pathname: '/acme/settings/profile', tenantSlug: 'acme', labels: ['Workspace', 'Settings', 'Profile'] });
    expect(items.map((item) => item.to)).toEqual(['/acme/dashboard', '/acme/settings/profile', '/acme/settings/profile']);
  });

  it('derives labels when a page does not provide metadata', () => {
    const items = buildBreadcrumbItems({ area: 'platform', pathname: '/platform/tenants/acme' });
    expect(items.map((item) => item.label)).toEqual(['Platform', 'Tenants', 'Acme']);
    expect(items.at(-1)?.current).toBe(true);
  });
});
