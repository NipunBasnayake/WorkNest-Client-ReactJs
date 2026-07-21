import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, LoaderCircle, Printer } from 'lucide-react';
import { exportCsv, exportExcel, printReport, type ReportDataset } from '@/modules/analytics/reportExport';
import { useBranding } from '@/features/branding/useBranding';
import { normalizeBrandColor } from '@/features/branding/colorTokens';

export function ReportExportMenu({ report, compact = false, loadReport }: { report: ReportDataset; compact?: boolean; loadReport?: () => Promise<ReportDataset> }) {
  const { branding } = useBranding();
  const [loading, setLoading] = useState<'csv' | 'excel' | null>(null);
  const button = `inline-flex ${compact ? 'h-8 px-2 text-[10px]' : 'h-9 px-2.5 text-xs'} items-center gap-1.5 rounded-lg border font-semibold`;
  const style = { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' };
  async function run(kind: 'csv' | 'excel') {
    setLoading(kind);
    try {
      const dataset = loadReport ? await loadReport() : report;
      if (kind === 'csv') exportCsv(dataset); else exportExcel(dataset, {
        companyName: branding.companyName,
        primaryColor: normalizeBrandColor(branding.primaryColor),
      });
    } finally {
      setLoading(null);
    }
  }
  return <div className='flex flex-wrap gap-2 print:hidden'>
    <button className={button} style={style} disabled={loading !== null} onClick={() => void run('csv')}>{loading === 'csv' ? <LoaderCircle size={14} className='animate-spin' /> : <Download size={14} />}CSV</button>
    <button className={button} style={style} disabled={loading !== null} onClick={() => void run('excel')}>{loading === 'excel' ? <LoaderCircle size={14} className='animate-spin' /> : <FileSpreadsheet size={14} />}Excel</button>
    <button className={button} style={style} onClick={() => printReport(report.title)}><FileText size={14} />PDF</button>
    <button className={button} style={style} onClick={() => printReport(report.title)}><Printer size={14} />Print</button>
  </div>;
}
