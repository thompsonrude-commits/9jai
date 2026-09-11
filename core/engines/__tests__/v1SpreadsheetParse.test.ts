import { describe, it, expect } from 'vitest';
import XLSX from 'xlsx';

// Import the Cloud Function handler
import { analyzeWorkbookBuffer } from '../../../functions/src/providers/spreadsheetParser';

describe('spreadsheet parser integration', () => {
  it('parses a simple workbook buffer and returns structured workbook info', () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Product', 'Price', 'Date'],
      ['Apple', 1.2, '2024-01-01'],
      ['Banana', 0.5, '2024-01-02'],
      ['Cherry', 2.5, '2024-01-03'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const info = analyzeWorkbookBuffer(buf);
    expect(info.sheetCount).toBeGreaterThan(0);
    const sheet = info.sheets.find((s: any) => s.name === 'Sheet1');
    expect(sheet).toBeTruthy();
    expect(sheet.headers).toEqual(['Product', 'Price', 'Date']);
    const priceCol = sheet.columns.find((c: any) => c.header === 'Price');
    expect(priceCol).toBeTruthy();
    expect(priceCol.inferredType).toBe('number');
  });
});
