/**
 * @file StudentAttendanceDashboard.tsx
 * @description Student's own attendance from GET /attendance/student/:id: CBSE 75% compliance
 * meter, summary counts and a month-by-month history of the actual roll-call records.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarX2, ChevronLeft, ChevronRight, GraduationCap, RefreshCw, ShieldCheck } from 'lucide-react';
import { useStudentAttendance } from '../../../hooks';

interface StudentAttendanceDashboardProps {
  user: any;
}

const MINIMUM = 75;

const STATUS_STYLES: Record<string, string> = {
  PRESENT:
    'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-200',
  ABSENT: 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-200',
  LATE: 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200',
};
const STATUS_DOT: Record<string, string> = { PRESENT: 'bg-emerald-500', ABSENT: 'bg-rose-500', LATE: 'bg-amber-500' };

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const StudentAttendanceDashboard: React.FC<StudentAttendanceDashboardProps> = ({ user }) => {
  const studentId: string = user?.studentProfile?.id ?? '';
  const enrollment = user?.studentProfile?.enrollments?.[0];
  const query = useStudentAttendance(studentId);
  const summary = query.data?.summary;
  const totalDays = summary?.totalDays ?? 0;
  const hasRecords = totalDays > 0;
  const percentage = hasRecords ? summary!.percentage : 0;
  const safe = percentage >= MINIMUM;

  // Group the real records by month, newest month first
  const months = useMemo(() => {
    const map = new Map<string, Array<{ id: string; date: Date; status: string; reason?: string | null }>>();
    for (const r of query.data?.records ?? []) {
      const date = new Date(r.date);
      if (Number.isNaN(date.getTime())) continue;
      const key = monthKey(date);
      map.set(key, [...(map.get(key) ?? []), { id: r.id, date, status: r.status, reason: r.reason }]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, recs]) => ({ key, records: recs.sort((x, y) => x.date.getTime() - y.date.getTime()) }));
  }, [query.data]);

  const [monthIndex, setMonthIndex] = useState(0);
  const month = months[Math.min(monthIndex, Math.max(0, months.length - 1))];
  const monthLabel = month
    ? new Date(`${month.key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2 flex-wrap">
            <span>My Attendance Record</span>
            {enrollment?.class?.name && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-blue-subtle text-accent-blue">
                {enrollment.class.name} - Section {enrollment.section?.name}
              </span>
            )}
          </h1>
          <p className="text-xs text-secondary mt-1">
            Your official roll-call record and CBSE {MINIMUM}% attendance compliance. Absences are recorded by your class teacher.
          </p>
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="h-52 rounded-3xl bg-surface-raised animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-surface-raised animate-pulse" />
            ))}
          </div>
        </div>
      ) : query.isError ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-500" />
          <h3 className="text-base font-bold text-primary">Could not load your attendance</h3>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : !hasRecords ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
          <CalendarX2 className="w-10 h-10 mx-auto mb-3 text-muted" />
          <h3 className="text-base font-bold text-primary">No attendance recorded yet</h3>
          <p className="text-sm text-secondary mt-1">Your record will appear here once your class teacher marks the roll call.</p>
        </div>
      ) : (
        <>
          {/* Compliance meter */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] p-8 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="relative z-10 space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-sky-50">
                <ShieldCheck className="w-4 h-4 text-amber-200" />
                <span>CBSE Norm Compliance Meter</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{percentage}% Attendance</h2>
              <p className="text-xs sm:text-sm text-sky-50 font-medium leading-relaxed">
                {safe ? 'Meets' : 'Below'} the CBSE {MINIMUM}% requirement. You attended{' '}
                <strong className="text-white">{summary!.presentDays}</strong> of{' '}
                <strong className="text-white">{totalDays}</strong> recorded school days.
              </p>
              <div className="space-y-1.5 pt-2 max-w-md">
                <div className="flex justify-between text-xs font-bold text-sky-50">
                  <span>Required: {MINIMUM}%</span>
                  <span className="text-white font-extrabold">
                    {percentage}% {safe ? '(Safe)' : '(Shortage)'}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-amber-200 z-10" />
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${safe ? 'bg-emerald-300' : 'bg-rose-300'}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="relative z-10 w-36 h-36 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center text-center p-3 shrink-0">
              <GraduationCap className="w-9 h-9 text-amber-200 mb-1" />
              <span className="text-2xl font-extrabold">
                {summary!.presentDays} / {totalDays}
              </span>
              <span className="text-[10px] text-sky-50 font-bold uppercase tracking-wider mt-0.5">Days Attended</span>
            </div>
          </motion.div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Recorded Days', value: totalDays, tone: 'text-primary', hint: 'Roll calls taken so far' },
              { label: 'Days Present', value: summary!.presentDays, tone: 'text-emerald-600 dark:text-emerald-400', hint: 'Marked present' },
              { label: 'Days Absent', value: summary!.absentDays, tone: 'text-rose-600 dark:text-rose-400', hint: 'Marked absent' },
              { label: 'Late Arrivals', value: summary!.lateDays, tone: 'text-amber-600 dark:text-amber-400', hint: 'Marked late' },
            ].map((c) => (
              <div key={c.label} className="bg-surface rounded-3xl p-5 border border-border shadow-card">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{c.label}</span>
                <h3 className={`text-3xl font-extrabold mt-2 ${c.tone}`}>
                  {c.value} Day{c.value === 1 ? '' : 's'}
                </h3>
                <p className="text-xs text-muted mt-1">{c.hint}</p>
              </div>
            ))}
          </div>

          {/* Monthly history */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={monthIndex >= months.length - 1}
                  onClick={() => setMonthIndex((i) => i + 1)}
                  className="p-2 rounded-xl bg-surface-raised text-secondary hover:bg-accent-blue-subtle transition-all disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-primary">Attendance History — {monthLabel}</h3>
                  <p className="text-xs text-secondary">Days with a recorded roll call</p>
                </div>
                <button
                  type="button"
                  aria-label="Next month"
                  disabled={monthIndex === 0}
                  onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
                  className="p-2 rounded-xl bg-surface-raised text-secondary hover:bg-accent-blue-subtle transition-all disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-secondary">
                {Object.entries(STATUS_DOT).map(([status, dot]) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${dot}`} /> {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {(month?.records ?? []).map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[90px] ${
                    STATUS_STYLES[rec.status] ?? 'bg-surface-raised border-border text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-primary">
                      {rec.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted">
                      {rec.date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-surface-raised">
                      {rec.status.replaceAll('_', ' ')}
                    </span>
                    {rec.reason && <span className="text-[10px] block mt-1 opacity-80">{rec.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
