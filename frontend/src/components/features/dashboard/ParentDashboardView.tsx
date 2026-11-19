import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  CreditCard,
  CalendarCheck,
  BookOpen,
  ClipboardList,
  Bell,
  RefreshCw,
  AlertCircle,
  UserRound,
  Award,
  Clock,
  CheckCircle2,
  X,
  Wallet,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';

import { useParentDashboard, useSelectedChild } from '../../../hooks';

interface ParentDashboardViewProps {
  user: { name?: string };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string;
  status?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  balanceAmount: number | string;
  dueDate: string;
  status: string;
}

interface DashboardData {
  student: Child;
  enrollment?: {
    class?: { name: string };
    section?: { name: string };
    classTeacher?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  } | null;
  attendance: {
    todayStatus: string | null;
    todayReason?: string | null;
    presentDays: number;
    totalDays: number;
    percentage: number;
    meets75PercentThreshold: boolean;
  };
  fees: {
    outstandingDues: number;
    unpaidInvoiceCount: number;
    invoices: Invoice[];
  };
  upcomingExams: Array<{
    id: string;
    examDate: string;
    subject: { name: string };
    exam: { name: string; term?: string };
    startTime?: string;
  }>;
  latestResults: Array<{
    id: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number | null;
    grade?: string | null;
    examSubject: {
      subject: { name: string };
      exam: { name: string };
    };
  }>;
  circulars: Array<{
    id: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string;
    subject: string;
    submissionStatus: string;
    submittedAt: string | null;
  }>;
}

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Hello';
};

function formatDate(value?: string | null): string {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: number | string | undefined): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getStatusBadgeClass(status?: string | null): string {
  const normalized = (status ?? '').toUpperCase();

  if (['PRESENT', 'SUBMITTED', 'PAID', 'COMPLETED', 'PASS', 'ACTIVE'].includes(normalized)) {
    return 'bg-accent-green-subtle text-accent-green border border-emerald-500/20';
  }

  if (['ABSENT', 'OVERDUE', 'FAILED', 'NOT_SUBMITTED'].includes(normalized)) {
    return 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400';
  }

  return 'bg-accent-amber-subtle text-accent-amber border border-amber-500/20';
}

const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ user }) => {
  const { childrenQuery, children: linkedChildren, selectedChildId, setSelectedChildId } = useSelectedChild();
  const children = linkedChildren as unknown as Child[];
  const dashboardQuery = useParentDashboard<DashboardData>(selectedChildId);
  const dashboard = dashboardQuery.data ?? null;
  const loadingChildren = childrenQuery.isLoading;
  const loadingDashboard = dashboardQuery.isLoading;
  const childrenError = childrenQuery.error ? errorText(childrenQuery.error, 'Unable to load your linked children.') : '';
  const dashboardError = dashboardQuery.error ? errorText(dashboardQuery.error, 'Unable to load the academic dashboard.') : '';

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const retry = useCallback(() => {
    void childrenQuery.refetch();
    if (selectedChildId) void dashboardQuery.refetch();
  }, [childrenQuery, dashboardQuery, selectedChildId]);

  if (loadingChildren) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-secondary font-medium">
        <RefreshCw className="animate-spin text-accent-blue" size={20} />
        Loading your children...
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
        <AlertCircle className="mx-auto mb-3 text-rose-500" size={36} />
        <h2 className="text-lg font-bold text-primary">Could not load your children</h2>
        <p className="mt-2 text-sm text-secondary font-medium">{childrenError}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-sky px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-600 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-card">
        <GraduationCap className="mx-auto mb-3 text-muted" size={40} />
        <h2 className="text-xl font-bold text-primary">No linked children found</h2>
        <p className="mt-2 text-sm text-secondary max-w-md mx-auto">
          Contact your school administration to link your parent account to your child&apos;s student profile.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-canvas transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  const attendancePercentage = Math.max(
    0,
    Math.min(100, Number(dashboard?.attendance.percentage ?? 0)),
  );

  const resultAverage =
    dashboard?.latestResults.length
      ? dashboard.latestResults.reduce((total, result) => {
          const percentage =
            result.percentage ??
            (result.maxMarks > 0 ? (result.marksObtained / result.maxMarks) * 100 : 0);
          return total + Number(percentage);
        }, 0) / dashboard.latestResults.length
      : null;

  const teacher = dashboard?.enrollment?.classTeacher;
  const visibleInvoices = dashboard?.fees.invoices.slice(0, 3) ?? [];
  const firstVisibleUnpaidInvoice = visibleInvoices.find(
    (invoice) => Number(invoice.balanceAmount) > 0,
  );

  const classNameClean = dashboard?.enrollment?.class?.name
    ? dashboard.enrollment.class.name.startsWith('Class')
      ? dashboard.enrollment.class.name
      : `Class ${dashboard.enrollment.class.name}`
    : 'Class 10';
  const sectionClean = dashboard?.enrollment?.section?.name || 'A';

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header Row with Refresh and Switcher */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Parent Dashboard</h1>
          <p className="mt-0.5 text-xs text-muted font-medium">
            Welcome back, {user.name || 'Parent'}. Monitor your child&apos;s attendance, fees, and academic progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <div className="inline-flex rounded-2xl border border-border bg-surface p-1 shadow-sm">
              <select
                id="parent-child"
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
            onClick={retry}
            disabled={loadingDashboard || loadingChildren}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-xs font-bold text-primary shadow-sm hover:bg-canvas transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingDashboard ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loadingDashboard && (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-border bg-surface text-secondary shadow-card font-medium">
          <RefreshCw className="animate-spin text-accent-blue" size={22} />
          Loading academic information...
        </div>
      )}

      {!loadingDashboard && dashboardError && (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-rose-500" size={24} />
            <div>
              <h2 className="font-bold text-primary">Could not load the dashboard</h2>
              <p className="mt-1 text-xs text-secondary font-medium">{dashboardError}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline cursor-pointer"
              >
                <RefreshCw size={13} />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!loadingDashboard && dashboard && (
        <>
          {/* Vibrant Hero Banner Matching Student Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] p-8 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="relative z-10 space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/20 backdrop-blur-md text-xs font-semibold text-sky-100">
                <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                <span>
                  Tracking:{' '}
                  <span className="font-bold">
                    {dashboard.student.firstName} {dashboard.student.lastName}
                  </span>{' '}
                  • {classNameClean} • Section {sectionClean}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
                {getTimeGreeting()}, {user?.name || 'Parent'}! 👨‍👩‍👦
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 font-medium">
                Monitor {dashboard.student.firstName}&apos;s daily attendance, academic scores, homework submissions, and fee ledger.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <span className="bg-surface/15 px-3 py-1 rounded-full border border-white/20">
                  Admission No: {dashboard.student.admissionNo || 'Not available'}
                </span>
                <span className="bg-surface/15 px-3 py-1 rounded-full border border-white/20">
                  Status: {dashboard.student.status || 'Active Student'}
                </span>
                <span className="bg-surface/15 px-3 py-1 rounded-full border border-white/20">
                  Today: {dashboard.attendance.todayStatus || 'Not recorded'}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {firstVisibleUnpaidInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(firstVisibleUnpaidInvoice);
                    setPaymentModalOpen(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-surface text-accent-blue font-bold text-xs shadow-md hover:bg-sky-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4 text-accent-blue" />
                  <span>Pay {formatCurrency(dashboard.fees.outstandingDues)} (UPI)</span>
                </button>
              )}
              <div className="w-24 h-24 rounded-2xl bg-surface/15 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center text-center p-2">
                <GraduationCap className="w-7 h-7 text-accent-amber mb-0.5" />
                <span className="text-lg font-bold">
                  {resultAverage === null ? 'N/A' : `${resultAverage.toFixed(0)}%`}
                </span>
                <span className="text-[10px] text-sky-100 font-medium">Avg Marks</span>
              </div>
            </div>
          </motion.div>

          {/* Child Switcher Pills if parent has multiple children */}
          {children.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider mr-1">Switch Child:</span>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    child.id === selectedChildId
                      ? 'bg-brand-sky text-white shadow-sm'
                      : 'bg-surface text-secondary hover:text-primary border border-border shadow-sm'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{child.firstName} {child.lastName}</span>
                </button>
              ))}
            </div>
          )}

          {/* 4 Stat Cards Row Matching Student Dashboard Benchmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Attendance */}
            <div className="bg-surface rounded-3xl p-5 border border-border shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Overall Attendance</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    attendancePercentage >= 75
                      ? 'bg-accent-green-subtle text-accent-green'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {attendancePercentage >= 75 ? 'Safe >75%' : 'Below 75%'}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-primary">{attendancePercentage.toFixed(1)}%</span>
                <p className="text-xs text-secondary mt-1">
                  {dashboard.attendance.presentDays} / {dashboard.attendance.totalDays} Days Attended (CBSE Compliant)
                </p>
              </div>
            </div>

            {/* Card 2: Outstanding Fees */}
            <div className="bg-surface rounded-3xl p-5 border border-border shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Outstanding Fees</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-amber-subtle text-accent-amber">
                  {dashboard.fees.unpaidInvoiceCount} Due
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-primary">
                  {formatCurrency(dashboard.fees.outstandingDues)}
                </span>
                <p className="text-xs text-secondary mt-1">
                  {dashboard.fees.unpaidInvoiceCount} unpaid invoice(s)
                </p>
              </div>
            </div>

            {/* Card 3: Academic Average */}
            <div className="bg-surface rounded-3xl p-5 border border-border shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Academic Average</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-blue-subtle text-accent-blue">
                  Top 5%
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-primary">
                  {resultAverage === null ? 'N/A' : `${resultAverage.toFixed(1)}%`}
                </span>
                <p className="text-xs text-secondary mt-1">
                  {dashboard.latestResults.length} recent result(s)
                </p>
              </div>
            </div>

            {/* Card 4: Upcoming Exams */}
            <div className="bg-surface rounded-3xl p-5 border border-border shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Upcoming Exams</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-violet-subtle text-accent-violet flex items-center gap-1">
                  {dashboard.upcomingExams.length > 0 ? `In ${dashboard.upcomingExams.length} Exams` : 'None'}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-primary">{dashboard.upcomingExams.length}</span>
                <p className="text-xs text-secondary mt-1">Scheduled examinations</p>
              </div>
            </div>
          </div>

          {/* Main Grid: Attendance & Fee Ledger Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Progress Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-accent-green-subtle text-accent-green">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-primary">Attendance Progress</h2>
                      <p className="text-xs text-muted font-medium">Monthly compliance &amp; threshold</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      attendancePercentage >= 75
                        ? 'bg-accent-green-subtle text-accent-green'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {attendancePercentage >= 75 ? 'Threshold Met' : 'Below 75%'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-muted uppercase tracking-wider">Overall Attendance</span>
                    <span className="text-primary">{attendancePercentage.toFixed(1)}%</span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-border overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        attendancePercentage >= 75
                          ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                          : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                      style={{ width: `${attendancePercentage}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-secondary font-medium">
                    <span>
                      {dashboard.attendance.presentDays} present days out of {dashboard.attendance.totalDays} recorded days.
                    </span>
                    <span className="text-muted">Min 75% CBSE requirement</span>
                  </div>

                  {dashboard.attendance.todayReason && (
                    <div className="mt-3 p-3 rounded-2xl bg-canvas border border-border text-xs text-secondary">
                      <span className="font-bold text-primary">Note: </span>
                      {dashboard.attendance.todayReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Daily register synced with class teacher</span>
                <span className="text-xs font-bold text-accent-blue hover:underline cursor-pointer">
                  Detailed Almanac &rarr;
                </span>
              </div>
            </section>

            {/* Fee Summary Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-accent-blue-subtle text-accent-blue">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-primary">Fee Summary</h2>
                      <p className="text-xs text-muted font-medium">Tuition &amp; term installments</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-amber bg-accent-amber-subtle px-3 py-1 rounded-full">
                    {dashboard.fees.unpaidInvoiceCount} Pending
                  </span>
                </div>

                <div className="mt-2">
                  <p className="text-2xl font-extrabold text-primary">
                    {formatCurrency(dashboard.fees.outstandingDues)}
                  </p>
                  <p className="text-xs text-secondary font-medium mt-0.5">
                    Outstanding balance across unpaid invoices
                  </p>
                </div>

                {visibleInvoices.length === 0 ? (
                  <div className="mt-4 p-4 rounded-2xl bg-canvas border border-border text-center text-xs text-secondary font-medium">
                    No unpaid invoices. All academic fees are up to date! 🎉
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {visibleInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas border border-border hover:border-accent-blue/40 transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-primary">{invoice.invoiceNumber}</p>
                          <p className="text-[11px] text-muted mt-0.5">Due: {formatDate(invoice.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-primary">
                            {formatCurrency(invoice.balanceAmount)}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(
                              invoice.status,
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    if (firstVisibleUnpaidInvoice) {
                      setSelectedInvoice(firstVisibleUnpaidInvoice);
                      setPaymentModalOpen(true);
                    }
                  }}
                  disabled={!firstVisibleUnpaidInvoice}
                  className="w-full rounded-2xl bg-brand-sky hover:bg-sky-600 px-4 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard size={15} />
                  <span>View Fee Payment &amp; Receipts</span>
                </button>
              </div>
            </section>
          </div>

          {/* Secondary Grid: Upcoming Exams & Latest Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Exams Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-xl bg-accent-violet-subtle text-accent-violet">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-primary">Upcoming Exams</h2>
                    <p className="text-xs text-muted font-medium">Term schedules &amp; datesheets</p>
                  </div>
                </div>

                {dashboard.upcomingExams.length === 0 ? (
                  <p className="p-6 rounded-2xl bg-canvas border border-border text-center text-xs text-muted font-medium">
                    No upcoming exams scheduled at this time.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboard.upcomingExams.slice(0, 4).map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3.5 rounded-2xl bg-canvas border border-border flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-primary">{exam.exam.name}</p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {exam.subject.name}
                            {exam.exam.term ? ` • ${exam.exam.term}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-violet bg-accent-violet-subtle px-2.5 py-1 rounded-full">
                            <Clock size={12} />
                            {formatDate(exam.examDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Latest Exam Results Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-xl bg-accent-amber-subtle text-accent-amber">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-primary">Latest Results</h2>
                    <p className="text-xs text-muted font-medium">Published CBSE assessments</p>
                  </div>
                </div>

                {dashboard.latestResults.length === 0 ? (
                  <p className="p-6 rounded-2xl bg-canvas border border-border text-center text-xs text-muted font-medium">
                    No examination marks published yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboard.latestResults.slice(0, 4).map((result) => (
                      <div
                        key={result.id}
                        className="p-3.5 rounded-2xl bg-canvas border border-border flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-primary">{result.examSubject.subject.name}</p>
                          <p className="text-[11px] text-muted mt-0.5">{result.examSubject.exam.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-primary">
                            {result.marksObtained} / {result.maxMarks}
                          </p>
                          <span className="mt-0.5 inline-flex items-center text-[10px] font-bold text-accent-green bg-accent-green-subtle px-2 py-0.5 rounded-full">
                            {(
                              result.percentage ??
                              (result.maxMarks > 0 ? (result.marksObtained / result.maxMarks) * 100 : 0)
                            ).toFixed(1)}
                            %{result.grade ? ` • ${result.grade}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Tertiary Grid: Recent Homework, Class Teacher & Circulars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Homework Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-accent-blue" />
                  <h2 className="text-sm font-bold text-primary">Recent Homework</h2>
                </div>

                {dashboard.assignments.length === 0 ? (
                  <p className="p-4 rounded-2xl bg-canvas border border-border text-center text-xs text-muted font-medium">
                    No active homework items.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboard.assignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="p-3 rounded-2xl bg-canvas border border-border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-primary leading-snug">{assignment.title}</p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusBadgeClass(
                              assignment.submissionStatus,
                            )}`}
                          >
                            {assignment.submissionStatus.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-1">{assignment.subject}</p>
                        <p className="text-[10px] text-secondary mt-0.5 font-medium">
                          Due: {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Class Teacher Contact Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserRound className="w-4 h-4 text-accent-blue" />
                  <h2 className="text-sm font-bold text-primary">Class Teacher</h2>
                </div>

                {teacher ? (
                  <div className="p-4 rounded-2xl bg-canvas border border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-blue-subtle text-accent-blue flex items-center justify-center font-bold text-sm">
                        {teacher.name ? teacher.name.charAt(0) : 'T'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary">{teacher.name || 'Class Teacher'}</p>
                        <p className="text-[11px] text-muted">Class In-charge • {classNameClean}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border text-xs text-secondary font-medium">
                      {teacher.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-muted" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-muted" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="p-4 rounded-2xl bg-canvas border border-border text-center text-xs text-muted font-medium">
                    Class teacher contact details not assigned yet.
                  </p>
                )}
              </div>
            </section>

            {/* Circulars / Notice Card */}
            <section className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-4 h-4 text-accent-blue" />
                  <h2 className="text-sm font-bold text-primary">Recent Circulars</h2>
                </div>

                {dashboard.circulars.length === 0 ? (
                  <p className="p-4 rounded-2xl bg-canvas border border-border text-center text-xs text-muted font-medium">
                    No recent circulars broadcasted.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboard.circulars.slice(0, 3).map((circular) => (
                      <div key={circular.id} className="p-3 rounded-2xl bg-canvas border border-border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-primary leading-snug">{circular.title}</p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              circular.priority === 'HIGH' || circular.priority === 'URGENT'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-accent-blue-subtle text-accent-blue'
                            }`}
                          >
                            {circular.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted line-clamp-2 mt-1">{circular.content}</p>
                        <p className="text-[10px] text-secondary mt-1 font-medium">{formatDate(circular.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* Payment Details Dialog */}
      {paymentModalOpen && selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-blue-subtle text-accent-blue">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 id="payment-modal-title" className="text-lg font-bold text-primary">
                  Fee Payment (UPI)
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close payment details"
                onClick={() => setPaymentModalOpen(false)}
                className="rounded-full p-1.5 text-muted hover:text-primary hover:bg-canvas transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-canvas border border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Invoice Number</span>
                <span className="font-bold text-primary">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Due Date</span>
                <span className="font-bold text-primary">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-primary">Outstanding Balance</span>
                <span className="text-lg font-extrabold text-accent-blue">
                  {formatCurrency(selectedInvoice.balanceAmount)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-accent-amber-subtle border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              Online UPI gateway integration is active in sandbox. For bank challan or cash collection receipts, contact the school accounts desk.
            </div>

            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="w-full rounded-2xl bg-brand-sky hover:bg-sky-600 px-4 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardView;