/**
 * @file FeeCollectionChart.tsx
 * @description Part-to-whole per fee structure: collected vs pending, as horizontal stacked
 * bars on one ₹ axis. Two series → legend + per-bar hover tooltip.
 */

import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FeeStructureSummary } from '../../../services';
import { formatInr, type ChartTheme } from './chartTheme';

interface Props {
  structures: FeeStructureSummary[];
  theme: ChartTheme;
}

const compactInr = (v: number) =>
  v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`;

export const FeeCollectionChart: React.FC<Props> = ({ structures, theme }) => {
  const data = structures.map((s) => ({
    label: `${s.name} · ${s.class}`,
    Collected: s.totalCollected,
    Pending: s.totalPending,
    rate: s.collectionPercentage,
  }));

  return (
    <div style={{ height: Math.max(140, data.length * 56 + 70) }} role="img" aria-label="Fee collected versus pending by fee structure">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={14}>
          <CartesianGrid horizontal={false} stroke={theme.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={compactInr}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: theme.axis }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={180}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: theme.axis }}
          />
          <Tooltip
            cursor={{ fill: theme.grid, opacity: 0.35 }}
            formatter={(value, name) => [formatInr(Number(value)), String(name)]}
            labelFormatter={(label, payload) => {
              const rate = payload?.[0]?.payload?.rate;
              return rate !== undefined ? `${label} — ${rate}% collected` : String(label);
            }}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: 12, border: 'none', color: theme.tooltipText, fontSize: 12 }}
            itemStyle={{ color: theme.tooltipText }}
            labelStyle={{ color: theme.tooltipText, fontWeight: 700, marginBottom: 4 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
            // Legend text stays in ink, the swatch carries identity
            formatter={(value) => <span style={{ color: theme.axis }}>{value}</span>}
          />
          {/* 2px surface stroke = gap between the stacked segments */}
          <Bar dataKey="Collected" stackId="fees" fill={theme.series1} stroke={theme.surface} strokeWidth={2} radius={[4, 0, 0, 4]} maxBarSize={28} />
          <Bar dataKey="Pending" stackId="fees" fill={theme.series2} stroke={theme.surface} strokeWidth={2} radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
