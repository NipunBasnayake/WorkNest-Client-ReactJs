export type ReportCell = string | number | boolean | Date | null | undefined;

export interface ReportDataset {
  title: string;
  headers: string[];
  rows: ReportCell[][];
}

const CSV_MIME_TYPE = 'text/csv;charset=utf-8';
const UTF8_BOM = '\ufeff';
const FORMULA_PREFIX = /^[\t\r\n ]*[=+\-@]/;
const INVALID_FILENAME_CHARACTERS = /[<>:"/\\|?*]/g;

function cellText(value: ReportCell): string {
  if (value == null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  return String(value);
}

export function escapeCsvCell(value: ReportCell): string {
  const raw = cellText(value);
  const safe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildCsvFilename(title: string, generatedAt = new Date()): string {
  const safeTitle = title
    .normalize('NFKC')
    .replace(INVALID_FILENAME_CHARACTERS, ' ')
    .split('')
    .map((character) => character.charCodeAt(0) < 32 ? ' ' : character)
    .join('')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100) || 'report';
  const date = generatedAt.toISOString().slice(0, 10);
  return `${safeTitle}-${date}.csv`;
}

export function createCsvBlob(report: ReportDataset): Blob {
  const parts: BlobPart[] = [UTF8_BOM];
  const rows: ReportCell[][] = [report.headers, ...report.rows];
  const batchSize = 2_000;

  for (let start = 0; start < rows.length; start += batchSize) {
    const end = Math.min(start + batchSize, rows.length);
    let chunk = '';
    for (let index = start; index < end; index += 1) {
      chunk += rows[index].map(escapeCsvCell).join(',');
      chunk += '\r\n';
    }
    parts.push(chunk);
  }

  return new Blob(parts, { type: CSV_MIME_TYPE });
}

export function exportCsv(report: ReportDataset): void {
  const url = URL.createObjectURL(createCsvBlob(report));
  const link = document.createElement('a');
  link.href = url;
  link.download = buildCsvFilename(report.title);
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
