import { describe, expect, it } from 'vitest';
import { buildCsvFilename, createCsvBlob, escapeCsvCell } from '@/modules/analytics/reportExport';

describe('CSV report export', () => {
  it('quotes delimiters, quotes, and line breaks', () => {
    expect(escapeCsvCell('Doe, Jane')).toBe('"Doe, Jane"');
    expect(escapeCsvCell('She said "hello"')).toBe('"She said ""hello"""');
    expect(escapeCsvCell('first\nsecond')).toBe('"first\nsecond"');
  });

  it('neutralizes spreadsheet formulas after leading whitespace', () => {
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(escapeCsvCell('  @IMPORTXML(A1)')).toBe('"\'  @IMPORTXML(A1)"');
    expect(escapeCsvCell('safe-value')).toBe('"safe-value"');
  });

  it('creates a BOM-prefixed CRLF document with a safe filename', async () => {
    const blob = createCsvBlob({ title: 'Employees', headers: ['Name', 'Joined'], rows: [['Nipün', new Date('2026-07-21T00:00:00Z')]] });
    expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toBe('"Name","Joined"\r\n"Nipün","2026-07-21T00:00:00.000Z"\r\n');
    expect(buildCsvFilename('Attendance: July/2026', new Date('2026-07-21T00:00:00Z'))).toBe('Attendance-July-2026-2026-07-21.csv');
  });
});
