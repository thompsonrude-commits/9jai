import XLSX from 'xlsx';
import fs from 'fs';

const wb = XLSX.utils.book_new();
const data = [
  ['Product', 'Price', 'Date'],
  ['Apple', 120, '2026-08-01'],
  ['Banana', 80, '2026-08-02'],
  ['Cherry', 200, '2026-08-03'],
];
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Sales');
const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync('test-data.xlsx', out);
console.log('Wrote test-data.xlsx');
