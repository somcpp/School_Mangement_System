/**
 * @file AttendanceChart.tsx
 * @description Attendance % per student (lowest first) against the 75% CBSE minimum.
 * Single series → no legend; the threshold is a labelled reference line, and students below
 * it are listed (with icon + label) in the defaulters table, so colour never carries status.
 */

import React from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AttendanceReportStudent } from '../../../services';
import type { ChartTheme } from './chartTheme';

export const ATTENDANCE_MINIMUM = 75;

interface Props {
  students: AttendanceReportStudent[];
  theme: ChartTheme;
}

export const AttendanceChart: React.FC<Props> = ({ students, theme }) => {
  const data = [...students]
    .sort((a, b) => a.percentage - b.percentage)
    .map((s) => ({ name: s.name, percentage: s.percentage, present: s.presentDays, total: s.totalDays }));

  return (
    <div className="h-72" role="img" aria-label="Attendance percentage per student">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="3 3" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11, fill: theme.axis }} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
            width={44}
            tick={{ fontSize: 11, fill: theme.axis }}
          />
          <Tooltip
            cursor={{ fill: theme.grid, opacity: 0.35 }}
            formatter={(value, _name, item) => [
              `${value}% (${item?.payload?.present ?? 0}/${item?.payload?.total ?? 0} days)`,
              'Attendance',
            ]}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: 12, border: 'none', color: theme.tooltipText, fontSize: 12 }}
            itemStyle={{ color: theme.tooltipText }}
            labelStyle={{ color: theme.tooltipText, fontWeight: 700, marginBottom: 4 }}
          />
          <ReferenceLine
            y={ATTENDANCE_MINIMUM}
            stroke={theme.reference}
            strokeDasharray="4 4"
            label={{ value: `${ATTENDANCE_MINIMUM}% minimum`, position: 'insideTopRight', fill: theme.axis, fontSize: 11 }}
          />
          <Bar dataKey="percentage" fill={theme.series1} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
