import { usePageMeta } from '@/hooks/usePageMeta';
import { BusinessIntelligenceCenter } from '@/modules/analytics/components/BusinessIntelligenceCenter';

export function AnalyticsPage() {
  usePageMeta({ title: 'Business Intelligence', breadcrumb: ['Workspace', 'Business Intelligence'] });
  return <BusinessIntelligenceCenter mode='analytics' />;
}
