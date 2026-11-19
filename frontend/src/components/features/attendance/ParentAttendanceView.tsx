import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  UserRound,
} from 'lucide-react';
import { useChildAttendance, useSelectedChild } from '../../../hooks';

interface ParentAttendanceViewProps {
  user: {
    name?: string;
  };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string;
  status?: string;
}

interface AttendanceSummary {
  recordsReturned: number;
  presentDays: number;
  attendancePercentage: number;
}

interface MonthlyBreakdown {
  month: string;
  total: number;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  reason: string | null;
  remarks: string | null;
}

interface AttendanceData {
  studentId: string;
  summary: AttendanceSummary;
  monthlyBreakdown: MonthlyBreakdown[];
  records: AttendanceRecord[];
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const formatMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number);

  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
};

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PRESENT':
      return {
        label: 'Present',
        className: 'bg-accent-green-subtle text-accent-green border border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'ABSENT':
      return {
        label: 'Absent',
        className: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
        icon: XCircle,
      };
    case 'LATE':
      return {
        label: 'Late',
        className: 'bg-accent-amber-subtle text-accent-amber border border-amber-500/20',
        icon: Clock,
      };
    case 'HALF_DAY':
      return {
        label: 'Half day',
        className: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
        icon: Clock,
      };
    default:
      return {
        label: status.replaceAll('_', ' '),
        className: 'bg-canvas text-secondary border border-border',
        icon: CalendarCheck,
      };
  }
};

export const ParentAttendanceView: React.FC<ParentAttendanceViewProps> = ({ user }) => {
  const { childrenQuery, children: linkedChildren, selectedChildId, setSelectedChildId } = useSelectedChild();
  const children = linkedChildren as unknown as Child[];
  const detailQuery = useChildAttendance<AttendanceData>(selectedChildId);
  const attendance = detailQuery.data ?? null;
  const loadingChildren = childrenQuery.isLoading;
  const loadingAttendance = detailQuery.isLoading;
  const error = childrenQuery.error
    ? 'Could not load your linked children. Please try again.'
    : detailQuery.error
      ? 'Could not load attendance history. Please try again.'
      : '';
  const retry = () => {
    void childrenQuery.refetch();
    if (selectedChildId) void detailQuery.refetch();
  };

  const selectedChild = children.find((child) => child.id === selectedChildId);

  if (loadingChildren) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-secondary font-medium">
        <RefreshCw className="animate-spin text-accent-blue" size={20} />
        <span>Loading your children&apos;s information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Attendance</h1>
          <p className="mt-0.5 text-xs text-muted font-medium">
            Welcome{user.name ? `, ${user.name}` : ''}. Review your child&apos;s attendance history and compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <div className="inline-flex rounded-2xl border border-border bg-surface p-1 shadow-sm">
              <select
                id="parent-attendance-child"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id} className="bg-surface text-primary">
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-xs font-bold text-primary shadow-sm hover:bg-canvas transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => retry()}
            className="font-bold underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {children.length === 0 && !error && (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-card">
          <UserRound className="mx-auto mb-3 text-muted" size={40} />
          <h2 className="text-xl font-bold text-primary">No linked children found</h2>
          <p className="mt-2 text-sm text-secondary max-w-md mx-auto">
            Contact the school administration to link your parent account to your child&apos;s student profile.
          </p>
        </div>
      )}

      {children.length > 0 && (
        <>
          {selectedChild && (
            <div className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 shadow-card">
              <div className="rounded-2xl bg-accent-blue-subtle p-3 text-accent-blue">
                <UserRound size={26} />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h2>
                {selectedChild.admissionNo && (
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Admission No: {selectedChild.admissionNo}
                  </p>
                )}
              </div>
            </div>
          )}

          {loadingAttendance ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-border bg-surface text-secondary shadow-card font-medium">
              <RefreshCw className="animate-spin text-accent-blue" size={20} />
              <span>Loading attendance history...</span>
            </div>
          ) : attendance ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-border bg-surface p-6 shadow-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">
                      Attendance Percentage
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        attendance.summary.attendancePercentage >= 75
                          ? 'bg-accent-green-subtle text-accent-green'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {attendance.summary.attendancePercentage >= 75 ? 'Safe >75%' : 'Below 75%'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-primary">
                      {attendance.summary.attendancePercentage.toFixed(1)}%
                    </span>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          attendance.summary.attendancePercentage >= 75
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, attendance.summary.attendancePercentage))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-secondary font-medium">
                      {attendance.summary.attendancePercentage >= 75
                        ? 'Meeting the 75% CBSE attendance compliance requirement'
                        : 'Below the recommended 75% attendance threshold'}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-border bg-surface p-6 shadow-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">
                      Days Marked Present
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-blue-subtle text-accent-blue">
                      Active
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-primary">
                      {attendance.summary.presentDays}
                    </span>
                    <p className="mt-2 text-xs text-secondary font-medium">
                      Across {attendance.summary.recordsReturned} roll call sessions recorded in total.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Monthly Breakdown */}
              <section className="rounded-3xl border border-border bg-surface p-6 shadow-card">
                <h2 className="mb-4 text-base font-bold text-primary">Monthly Breakdown</h2>

                {attendance.monthlyBreakdown.length === 0 ? (
                  <p className="p-4 rounded-2xl bg-canvas border border-border text-center text-xs text-muted font-medium">
                    No monthly attendance records are available yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {attendance.monthlyBreakdown.map((month) => (
                      <div key={month.month} className="p-4 rounded-2xl bg-canvas border border-border">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-primary">
                            {formatMonth(month.month)}
                          </span>
                          <span className="text-xs font-bold text-secondary">
                            {month.present} / {month.total} counted days
                          </span>
                        </div>

                        <div className="flex h-3 overflow-hidden rounded-full bg-border">
                          {month.total > 0 && (
                            <>
                              <div
                                className="bg-emerald-500"
                                style={{ width: `${(month.present / month.total) * 100}%` }}
                                title={`${month.present} present`}
                              />
                              <div
                                className="bg-rose-500"
                                style={{ width: `${(month.absent / month.total) * 100}%` }}
                                title={`${month.absent} absent`}
                              />
                              <div
                                className="bg-amber-400"
                                style={{ width: `${(month.late / month.total) * 100}%` }}
                                title={`${month.late} late`}
                              />
                            </>
                          )}
                        </div>

                        <p className="mt-2 text-[11px] text-muted font-medium">
                          Present: {month.present} · Absent: {month.absent} · Late: {month.late}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Attendance Table */}
              <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
                <div className="border-b border-border p-5">
                  <h2 className="text-base font-bold text-primary">Recent Attendance Records</h2>
                  <p className="mt-0.5 text-xs text-muted font-medium">
                    Detailed daily roll calls marked by the subject and class teachers.
                  </p>
                </div>

                {attendance.records.length === 0 ? (
                  <p className="p-6 text-center text-xs text-muted font-medium">
                    No attendance records are available yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-xs">
                      <thead className="bg-canvas border-b border-border text-muted uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Reason</th>
                          <th className="px-5 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {attendance.records.map((record) => {
                          const style = getStatusStyle(record.status);
                          const StatusIcon = style.icon;

                          return (
                            <tr key={record.id} className="hover:bg-canvas/50 transition-colors">
                              <td className="whitespace-nowrap px-5 py-3.5 font-medium text-primary">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.className}`}
                                >
                                  <StatusIcon size={13} />
                                  {style.label}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-secondary">
                                {record.reason || '—'}
                              </td>
                              <td className="px-5 py-3.5 text-secondary">
                                {record.remarks || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : (
            !error && (
              <div className="rounded-3xl border border-border bg-surface p-6 text-xs text-muted font-medium shadow-card text-center">
                Attendance details are not available.
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ParentAttendanceView;
