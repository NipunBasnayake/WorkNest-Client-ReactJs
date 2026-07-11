import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportCsv, exportExcel, printReport, type ReportDataset } from '@/modules/analytics/reportExport';

export function ReportExportMenu({ report }: { report: ReportDataset }) {
  const button = 'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold';
  const style = { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' };
  return <div className='flex flex-wrap gap-2 print:hidden'>
    <button className={button} style={style} onClick={() => exportCsv(report)}><Download size={14} />CSV</button>
    <button className={button} style={style} onClick={() => exportExcel(report)}><FileSpreadsheet size={14} />Excel</button>
    <button className={button} style={style} onClick={() => printReport(report.title)}><FileText size={14} />PDF</button>
    <button className={button} style={style} onClick={() => printReport(report.title)}><Printer size={14} />Print</button>
  </div>;
}
