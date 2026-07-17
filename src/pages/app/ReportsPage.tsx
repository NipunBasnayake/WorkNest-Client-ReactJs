import { usePageMeta } from '@/hooks/usePageMeta';
import { FormalReportsCenter } from '@/modules/analytics/components/FormalReportsCenter';
import { useParams, useSearchParams } from 'react-router-dom';

const recruitmentReportTitles: Record<string, string> = {
  'recruitment-jobs': 'Job Openings Report',
  'recruitment-applications': 'Applications Report',
  'recruitment-interviews': 'Interview Report',
  'recruitment-hiring': 'Hiring Report',
};

export function ReportsPage() {
  const { domain } = useParams();
  const [searchParams] = useSearchParams();
  const recruitmentTitle = domain ? recruitmentReportTitles[domain] : undefined;
  const recruitmentCategory = searchParams.get('category')?.toLowerCase() === 'recruitment';
  usePageMeta({
    title: recruitmentTitle ?? (recruitmentCategory ? 'Recruitment Reports' : 'Reports & Analytics'),
    breadcrumb: recruitmentTitle
      ? ['Workspace', 'Reports & Analytics', 'Recruitment', recruitmentTitle]
      : recruitmentCategory
        ? ['Workspace', 'Reports & Analytics', 'Recruitment']
        : ['Workspace', 'Reports & Analytics'],
  });
  return <FormalReportsCenter />;
}
