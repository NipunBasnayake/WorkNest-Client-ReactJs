import { usePageMeta } from '@/hooks/usePageMeta';
import { BusinessIntelligenceCenter } from '@/modules/analytics/components/BusinessIntelligenceCenter';

export function AnalyticsPage() {
  usePageMeta({ title: 'Analytics', breadcrumb: ['Workspace', 'Analytics'] });
  return <BusinessIntelligenceCenter mode='analytics' />;
}
