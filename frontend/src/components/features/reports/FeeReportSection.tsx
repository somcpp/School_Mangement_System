/**
 * @file FeeReportSection.tsx
 * @description Fee collection report: KPI tiles, collected-vs-pending chart, table view and
 * CSV export — all from GET /reports/fees.
 */

import React from 'react';
import { AlertCircle, Download, IndianRupee, RefreshCw, Wallet } from 'lucide-react';
import { useFeeReport } from '../../../hooks';
import { FeeCollectionChart } from './FeeCollectionChart';
import { downloadCsv, formatInr, type ChartTheme } from './chartTheme';

const Tile: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="p-4 rounded-2xl bg-surface-raised border border-border">
    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</span>
    <p className="text-xl font-extrabold text-primary mt-1">{value}</p>
    {hint && <span className="text-[11px] text-secondary">{hint}</span>}
  </div>
);

export const FeeReportSection: React.FC<{ schoolId?: string; enabled: boolean; theme: ChartTheme }> = ({
  schoolId,
  enabled,
  theme,
}) => {
  const query = useFeeReport(schoolId, enabled);
  const structures = query.data?.feeStructures ?? [];
  const billed = structures.reduce((a, s) => a + s.totalBilled, 0);
  const collected = structures.reduce((a, s) => a + s.totalCollected, 0);
  const pending = structures.reduce((a, s) => a + s.totalPending, 0);
  const invoices = structures.reduce((a, s) => a + s.invoicesCount, 0);
  const rate = billed > 0 ? Math.round((collected / billed) * 1000) / 10 : 0;

  const exportCsv = () =>
    downloadCsv(`fee_collection_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Fee Structure', 'Class', 'Invoices', 'Billed (INR)', 'Collected (INR)', 'Pending (INR)', 'Collection %'],
      ...structures.map((s) => [s.name, s.class, s.invoicesCount, s.totalBilled, s.totalCollected, s.totalPending, s.collectionPercentage]),
      ['Total', '', invoices, billed, collected, pending, rate],
    ]);

  return (
    <section className="bg-surface rounded-3xl p-6 border border-border shadow-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-blue-subtle text-accent-blue flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-primary">Fee Collection</h2>
            <p className="text-xs text-muted">Collected vs pending, by fee structure</p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!structures.length}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold shadow-card hover:bg-brand-sky-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {query.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-raised animate-pulse" />
            ))}
          </div>
          <div className="h-40 rounded-2xl bg-surface-raised animate-pulse" />
        </div>
      ) : query.isError ? (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-bold text-primary">Could not load the fee report</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-primary hover:bg-surface-raised cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : structures.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-raised border border-dashed border-border text-center">
          <IndianRupee className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p className="text-sm font-bold text-primary">No fee structures yet</p>
          <p className="text-xs text-secondary mt-1">Create a fee structure in Finance to start tracking collections.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile label="Total Billed" value={formatInr(billed)} hint={`${invoices} invoice${invoices === 1 ? '' : 's'}`} />
            <Tile label="Collected" value={formatInr(collected)} />
            <Tile label="Pending" value={formatInr(pending)} />
            <Tile label="Collection Rate" value={`${rate}%`} />
          </div>

          <FeeCollectionChart structures={structures} theme={theme} />

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs">
              <caption className="sr-only">Fee collection by fee structure</caption>
              <thead className="bg-surface-raised text-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left px-4 py-2.5">Fee Structure</th>
                  <th className="text-left px-4 py-2.5">Class</th>
                  <th className="text-right px-4 py-2.5">Billed</th>
                  <th className="text-right px-4 py-2.5">Collected</th>
                  <th className="text-right px-4 py-2.5">Pending</th>
                  <th className="text-right px-4 py-2.5">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-primary">{s.name}</td>
                    <td className="px-4 py-2.5 text-secondary">{s.class}</td>
                    <td className="px-4 py-2.5 text-right text-secondary">{formatInr(s.totalBilled)}</td>
                    <td className="px-4 py-2.5 text-right text-primary font-semibold">{formatInr(s.totalCollected)}</td>
                    <td className="px-4 py-2.5 text-right text-secondary">{formatInr(s.totalPending)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary">{s.collectionPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
