import XLSX from 'xlsx';

export type ColumnInfo = {
  header: string;
  index: number;
  sampleValues: any[];
  inferredType: 'string' | 'number' | 'date' | 'boolean' | 'mixed' | 'empty';
};

export type SheetInfo = {
  name: string;
  headers: string[];
  columns: ColumnInfo[];
  rowCount: number;
  previewRows: any[][];
};

export type WorkbookInfo = {
  sheetCount: number;
  sheets: SheetInfo[];
};

export function analyzeWorkbookBuffer(buffer: Buffer): WorkbookInfo {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: SheetInfo[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

    const headersRow = raw[0] && raw[0].length > 0 ? raw[0] : raw[0] || [];
    const headers = headersRow.map((h: any, i: number) => (h === null || h === undefined || h === '' ? `Column ${i + 1}` : String(h)));

    const rows = raw.slice(1);
    const rowCount = rows.length;
    const previewRows = rows.slice(0, 10);

    const columns: ColumnInfo[] = headers.map((h: string, idx: number) => {
      const samples = rows.slice(0, 50).map(r => r[idx]);
      const inferredType = inferColumnType(samples);
      return { header: h, index: idx, sampleValues: samples.slice(0, 5), inferredType } as ColumnInfo;
    });

    sheets.push({ name: sheetName, headers, columns, rowCount, previewRows });
  }

  return { sheetCount: sheets.length, sheets };
}

function inferColumnType(values: any[]): ColumnInfo['inferredType'] {
  let hasString = false;
  let hasNumber = false;
  let hasDate = false;
  let hasBoolean = false;
  let hasNonEmpty = false;

  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    hasNonEmpty = true;
    if (typeof v === 'number') hasNumber = true;
    if (Object.prototype.toString.call(v) === '[object Date]') hasDate = true;
    if (typeof v === 'boolean') hasBoolean = true;
    if (typeof v === 'string') {
      // Attempt numeric parse
      const n = Number(v.replace(/,/g, ''));
      if (!isNaN(n) && v.trim().length > 0) hasNumber = true; else hasString = true;
      // detect ISO date-ish
      const d = Date.parse(v);
      if (!isNaN(d)) hasDate = true;
    }
  }

  if (!hasNonEmpty) return 'empty';
  const types = [hasNumber, hasDate, hasBoolean, hasString].filter(Boolean).length;
  if (types > 1) return 'mixed';
  if (hasNumber) return 'number';
  if (hasDate) return 'date';
  if (hasBoolean) return 'boolean';
  return 'string';
}
