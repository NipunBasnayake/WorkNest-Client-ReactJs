import { usePageMeta } from '@/hooks/usePageMeta';
import { FormalReportsCenter } from '@/modules/analytics/components/FormalReportsCenter';

export function ReportsPage() {
  usePageMeta({ title: 'Reports & Analytics', breadcrumb: ['Workspace', 'Reports & Analytics'] });
  return <FormalReportsCenter />;
}
