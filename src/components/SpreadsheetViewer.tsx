/**
 * SpreadsheetViewer — renders AI-generated tables as interactive spreadsheets
 * with download to Excel (.xlsx), CSV, and JSON.
 */
import React, { useState, useCallback } from 'react';
import { Download, Table2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SpreadsheetViewerProps {
  data: { headers: string[]; rows: (string | number)[][] };
  title?: string;
}

export default function SpreadsheetViewer({ data, title = 'Data' }: SpreadsheetViewerProps) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedRows = React.useMemo(() => {
    if (sortCol === null) return data.rows;
    return [...data.rows].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data.rows, sortCol, sortDir]);

  const handleSort = (col: number) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const downloadXLSX = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
  }, [data, title]);

  const downloadCSV = useCallback(() => {
    const rows = [data.headers, ...data.rows];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}.csv`;
    link.click();
  }, [data, title]);

  const downloadJSON = useCallback(() => {
    const json = data.rows.map(row =>
      Object.fromEntries(data.headers.map((h, i) => [h, row[i]]))
    );
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}.json`;
    link.click();
  }, [data, title]);

  // Calculate column totals for numeric columns
  const totals = data.headers.map((_, ci) => {
    const vals = data.rows.map(r => r[ci]).filter(v => typeof v === 'number' || !isNaN(Number(v)));
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => (s as number) + Number(v), 0);
  });
  const hasTotals = totals.some(t => t !== null);

  return (
    <div className="w-full max-w-full rounded-2xl overflow-hidden border border-[#008751]/20 shadow-md bg-white">
      {/* Header */}
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table2 size={16} className="text-[#008751]" />
          <span className="text-sm font-bold text-[#008751]">{title}</span>
          <span className="text-[10px] text-gray-400 font-medium">{data.rows.length} rows × {data.headers.length} cols</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={downloadXLSX} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
            <Download size={10} /> Excel
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
            <Download size={10} /> CSV
          </button>
          <button onClick={downloadJSON} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
            <Download size={10} /> JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-[#008751]/10 z-10">
            <tr>
              <th className="px-2 py-1.5 text-[10px] font-bold text-gray-500 border border-gray-200 w-8">#</th>
              {data.headers.map((h, i) => (
                <th key={i} onClick={() => handleSort(i)}
                  className="px-2 py-1.5 text-left text-[11px] font-bold text-[#008751] border border-gray-200 cursor-pointer hover:bg-[#008751]/20 whitespace-nowrap select-none">
                  {h} {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 text-[10px] text-gray-400 border border-gray-100 text-center">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1 text-[11px] text-gray-800 border border-gray-100 whitespace-nowrap font-medium">
                    {typeof cell === 'number' ? cell.toLocaleString() : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
            {hasTotals && (
              <tr className="bg-[#008751]/10 font-bold sticky bottom-0">
                <td className="px-2 py-1.5 text-[10px] text-gray-500 border border-gray-200 text-center">Σ</td>
                {totals.map((t, i) => (
                  <td key={i} className="px-2 py-1.5 text-[11px] text-[#008751] border border-gray-200 font-bold">
                    {t !== null ? Number(t).toLocaleString() : ''}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
