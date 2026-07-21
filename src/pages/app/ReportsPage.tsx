import { usePageMeta } from '@/hooks/usePageMeta';
import { FormalReportsCenter } from '@/modules/analytics/components/FormalReportsCenter';
import { useParams } from 'react-router-dom';

const recruitmentReportTitles: Record<string, string> = {
  'recruitment-jobs': 'Job Openings Report',
  'recruitment-applications': 'Applications Report',
  'recruitment-interviews': 'Interview Report',
  'recruitment-hiring': 'Hiring Report',
};

export function ReportsPage() {
  const { domain } = useParams();
  const recruitmentTitle = domain ? recruitmentReportTitles[domain] : undefined;
  usePageMeta({
    title: recruitmentTitle ?? 'Reports',
    breadcrumb: recruitmentTitle
      ? ['Workspace', 'Reports', recruitmentTitle]
      : ['Workspace', 'Reports'],
  });
  return <FormalReportsCenter />;
}
