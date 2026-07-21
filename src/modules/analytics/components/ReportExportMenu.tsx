import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { exportCsv, type ReportDataset } from '@/modules/analytics/reportExport';

export function ReportExportMenu({ report, compact = false, loadReport }: { report: ReportDataset; compact?: boolean; loadReport?: () => Promise<ReportDataset> }) {
  const [loading, setLoading] = useState(false);
  const button = `inline-flex ${compact ? 'h-8 px-2 text-[10px]' : 'h-9 px-2.5 text-xs'} items-center gap-1.5 rounded-lg border font-semibold`;
  const style = { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' };

  async function run() {
    setLoading(true);
    try {
      exportCsv(loadReport ? await loadReport() : report);
    } finally {
      setLoading(false);
    }
  }

  return <div className='flex flex-wrap gap-2'>
    <button type='button' className={button} style={style} disabled={loading} onClick={() => void run()}>
      {loading ? <LoaderCircle size={14} className='animate-spin' /> : <Download size={14} />}
      Export CSV
    </button>
  </div>;
}
