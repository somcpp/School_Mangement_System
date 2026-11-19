/**
 * @file AttendanceReportSection.tsx
 * @description Attendance analytics for one class/section and date range: overall rate,
 * per-student chart against the 75% minimum, defaulters list and CSV export
 * — all from GET /reports/attendance.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarCheck, CheckCircle2, Download, RefreshCw, Users } from 'lucide-react';
import { useAttendanceReport, useReportClasses } from '../../../hooks';
import { AttendanceChart, ATTENDANCE_MINIMUM } from './AttendanceChart';
import { downloadCsv, type ChartTheme } from './chartTheme';

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const selectClass =
  'w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/30';

export const AttendanceReportSection: React.FC<{ schoolId?: string; enabled: boolean; theme: ChartTheme }> = ({
  schoolId,
  enabled,
  theme,
}) => {
  const classesQuery = useReportClasses(schoolId, enabled);
  const classes = classesQuery.data ?? [];

  const today = new Date();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [startDate, setStartDate] = useState(() => isoDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)));
  const [endDate, setEndDate] = useState(() => isoDay(today));

  // Reset selection when the target school changes; default to the first class
  useEffect(() => {
    setClassId('');
    setSectionId('');
  }, [schoolId]);
  useEffect(() => {
    if (!classId && classesQuery.data?.[0]) setClassId(classesQuery.data[0].id);
  }, [classesQuery.data, classId]);

  const sections = classes.find((c) => c.id === classId)?.sections ?? [];
  const query = useAttendanceReport({ classId, sectionId: sectionId || undefined, startDate, endDate, schoolId }, enabled);
  const students = query.data?.students ?? [];
  const recorded = students.filter((s) => s.totalDays > 0);
  const defaulters = useMemo(
    () => recorded.filter((s) => s.percentage < ATTENDANCE_MINIMUM).sort((a, b) => a.percentage - b.percentage),
    [recorded]
  );
  const className = classes.find((c) => c.id === classId)?.name ?? '';

  const exportCsv = () =>
    downloadCsv(`attendance_${className.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`, [
      ['Admission No', 'Student', 'Days Recorded', 'Present', 'Absent', 'Attendance %', `Below ${ATTENDANCE_MINIMUM}%`],
      ...students.map((s) => [
        s.admissionNo,
        s.name,
        s.totalDays,
        s.presentDays,
        s.absentDays,
        s.totalDays ? s.percentage : '',
        s.totalDays && s.percentage < ATTENDANCE_MINIMUM ? 'Yes' : 'No',
      ]),
    ]);

  return (
    <section className="bg-surface rounded-3xl p-6 border border-border shadow-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-green-subtle text-accent-green flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-primary">Attendance Analytics</h2>
            <p className="text-xs text-muted">Per-student attendance and students below the {ATTENDANCE_MINIMUM}% minimum</p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!students.length}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold shadow-card hover:bg-brand-sky-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters — one row above the chart */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-raised border border-border">
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Class</span>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId('');
            }}
            className={selectClass}
            disabled={!classes.length}
          >
            {classes.length === 0 && <option value="">No classes</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Section</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={selectClass}>
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                Section {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">From</span>
          <input type="date" value={startDate} max={endDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} className={selectClass} />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">To</span>
          <input type="date" value={endDate} min={startDate} onChange={(e) => e.target.value && setEndDate(e.target.value)} className={selectClass} />
        </label>
      </div>

      {classesQuery.isLoading || query.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-raised animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-surface-raised animate-pulse" />
        </div>
      ) : classesQuery.isError || query.isError ? (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-bold text-primary">Could not load the attendance report</p>
          <button
            type="button"
            onClick={() => {
              classesQuery.refetch();
              query.refetch();
            }}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-primary hover:bg-surface-raised cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : !classId ? (
        <div className="p-8 rounded-2xl bg-surface-raised border border-dashed border-border text-center text-sm text-secondary">
          Set up classes in Academics to see attendance analytics.
        </div>
      ) : recorded.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-raised border border-dashed border-border text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p className="text-sm font-bold text-primary">No attendance recorded in this period</p>
          <p className="text-xs text-secondary mt-1">
            {students.length} student{students.length === 1 ? '' : 's'} enrolled — widen the date range or mark attendance first.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-surface-raised border border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Overall Rate</span>
              <p className="text-xl font-extrabold text-primary mt-1">{query.data?.overallAttendanceRate}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-raised border border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Students</span>
              <p className="text-xl font-extrabold text-primary mt-1">{recorded.length}</p>
              <span className="text-[11px] text-secondary">with attendance recorded</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-raised border border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Below {ATTENDANCE_MINIMUM}%</span>
              <p className="text-xl font-extrabold text-primary mt-1">{defaulters.length}</p>
            </div>
          </div>

          <AttendanceChart students={recorded} theme={theme} />

          {defaulters.length === 0 ? (
            <p className="flex items-center gap-2 text-xs font-semibold text-accent-green">
              <CheckCircle2 className="w-4 h-4" /> Every student is at or above the {ATTENDANCE_MINIMUM}% minimum.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs">
                <caption className="sr-only">Students below the attendance minimum</caption>
                <thead className="bg-surface-raised text-muted uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="text-left px-4 py-2.5">Student</th>
                    <th className="text-left px-4 py-2.5">Admission No</th>
                    <th className="text-right px-4 py-2.5">Present / Days</th>
                    <th className="text-right px-4 py-2.5">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {defaulters.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 font-bold text-primary">{s.name}</td>
                      <td className="px-4 py-2.5 font-mono text-secondary">{s.admissionNo}</td>
                      <td className="px-4 py-2.5 text-right text-secondary">
                        {s.presentDays} / {s.totalDays}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-rose-subtle text-accent-rose font-bold">
                          <AlertTriangle className="w-3 h-3" /> {s.percentage}% · Below minimum
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};
