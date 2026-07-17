export type ReportCell = string | number | boolean | null | undefined;
export interface ReportDataset { title: string; headers: string[]; rows: ReportCell[][] }

const clean = (value: ReportCell) => String(value ?? '');
const spreadsheetSafe = (value: ReportCell) => { const text = clean(value); return /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text; };
const csvCell = (value: ReportCell) => { const quote = String.fromCharCode(34); return quote + spreadsheetSafe(value).replaceAll(quote, quote + quote) + quote; };
const escapeHtml = (value: ReportCell) => spreadsheetSafe(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
function download(content: BlobPart, mime: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
export function exportCsv(report: ReportDataset) {
  const csv = [report.headers, ...report.rows].map((row) => row.map(csvCell).join(',')).join('\n');
  download(`\ufeff${csv}`, 'text/csv;charset=utf-8', `${report.title}.csv`);
}
export function exportExcel(report: ReportDataset) {
  const table = `<table><thead><tr>${report.headers.map((item) => `<th>${escapeHtml(item)}</th>`).join('')}</tr></thead><tbody>${report.rows.map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(item)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  download(`\ufeff<html><body><h1>${escapeHtml(report.title)}</h1>${table}</body></html>`, 'application/vnd.ms-excel', `${report.title}.xls`);
}
export function printReport(title: string) {
  const previous = document.title; document.title = title; window.print(); document.title = previous;
}
