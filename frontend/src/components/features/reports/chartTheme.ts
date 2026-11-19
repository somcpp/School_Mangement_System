/**
 * @file chartTheme.ts
 * @description Chart colours for reports. Series colours are the validated reference palette
 * slots 1–2 (blue, orange), checked against this app's surfaces (#FFFFFF light, #1E293B dark):
 * CVD ΔE ≥ 24, normal-vision ΔE ≥ 31, ≥ 3:1 contrast in both modes. Text/axes use ink tokens,
 * never series colours. Update only via `dataviz/scripts/validate_palette.js`.
 */

export interface ChartTheme {
  series1: string; // collected / attendance
  series2: string; // pending
  surface: string; // used for the 2px gap between adjacent fills
  axis: string;
  grid: string;
  reference: string;
  tooltipBg: string;
  tooltipText: string;
}

export const getChartTheme = (mode: 'light' | 'dark'): ChartTheme =>
  mode === 'dark'
    ? {
        series1: '#3987e5',
        series2: '#d95926',
        surface: '#1E293B',
        axis: '#94A3B8',
        grid: '#334155',
        reference: '#CBD5E1',
        tooltipBg: '#0F172A',
        tooltipText: '#F1F5F9',
      }
    : {
        series1: '#2a78d6',
        series2: '#eb6834',
        surface: '#FFFFFF',
        axis: '#64748B',
        grid: '#E2E8F0',
        reference: '#475569',
        tooltipBg: '#0F172A',
        tooltipText: '#F8FAFC',
      };

export const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

/** Download rows as a UTF-8 CSV (values quoted, quotes escaped). */
export const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
