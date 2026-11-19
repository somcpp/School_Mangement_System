/**
 * @file SchoolAdminDashboardView.tsx
 * @description Tailored Dashboard for School Admins & Principals:
 * Powered by TanStack Query (useSchoolAdminDashboard), live ₹ INR metrics, and attendance tracking.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, FileText } from 'lucide-react';
import { useFeeReport, useSchoolAdminDashboard } from '../../../hooks';
import { useTheme } from '../../../context/ThemeContext';
import { FeeCollectionChart, getChartTheme } from '../reports';

interface SchoolAdminDashboardViewProps {
  user: any;
}

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Hello';
};

export const SchoolAdminDashboardView: React.FC<SchoolAdminDashboardViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const { data: dashboardData } = useSchoolAdminDashboard();
  const { resolvedTheme } = useTheme();
  const chartTheme = getChartTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
  const kpi = dashboardData?.kpi;


  const feeReportQuery = useFeeReport();
  const upcomingExams: any[] = dashboardData?.upcomingExams ?? [];
  const recentNotices: any[] = dashboardData?.recentAnnouncements ?? [];

  const isBrandNewSchool = !kpi?.totalStudents && !kpi?.totalTeachers;

  return (
    <div className="space-y-6">
      {/* Admin Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] p-8 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/20 backdrop-blur-md text-xs font-semibold text-sky-100">
            <Building2 className="w-3.5 h-3.5" />
            <span>{user?.school?.name || 'My School'} • Code: {user?.school?.code || 'CAMPUS'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            {getTimeGreeting()}, {user?.name || 'Administrator'}
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 font-medium">
            Academic Year {new Date().getFullYear()}–{(new Date().getFullYear() + 1).toString().slice(-2)} •{' '}
            {kpi?.todayAttendance?.rate !== undefined
              ? `Campus attendance at ${kpi.todayAttendance.rate}% today.`
              : 'Campus management portal ready.'}
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <button
            type="button"
            className="px-5 py-3 rounded-2xl bg-surface text-accent-blue font-bold text-xs shadow-md hover:bg-sky-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Campus Overview</span>
          </button>
        </div>
      </motion.div>

      {/* New School Quick-Start Onboarding Guide (Displays only when 0 students & 0 teachers) */}
      {isBrandNewSchool && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-surface border border-accent-blue/30 shadow-card space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-primary flex items-center gap-2">
                🚀 Welcome to your new SchoolHub campus!
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Complete these 3 foundational steps to activate your school's digital operations.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-blue-subtle text-accent-blue">
              Setup Mode
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface-raised border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Step 1</span>
              <h4 className="text-sm font-bold text-primary mt-1">Configure Classes</h4>
              <p className="text-xs text-muted mt-0.5">Add grades, sections, and subjects in Academics.</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-raised border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Step 2</span>
              <h4 className="text-sm font-bold text-primary mt-1">Add Faculty</h4>
              <p className="text-xs text-muted mt-0.5">Create teacher profiles and assign subjects.</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-raised border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Step 3</span>
              <h4 className="text-sm font-bold text-primary mt-1">Enroll Students</h4>
              <p className="text-xs text-muted mt-0.5">Admit students and generate roll numbers.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4 School Institutional Stat Cards (in ₹ INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface rounded-3xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Enrollment</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-blue-subtle text-accent-blue">
              Verified
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-primary">
              {kpi?.totalStudents !== undefined ? kpi.totalStudents.toLocaleString('en-IN') : '0'}
            </span>
            <p className="text-xs text-muted mt-1">Active Students enrolled</p>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Campus Attendance</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-green-subtle text-accent-green">
              {kpi?.todayAttendance?.rate !== undefined ? `${kpi.todayAttendance.rate}% Today` : '0% Today'}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-primary">
              {kpi?.todayAttendance?.total !== undefined
                ? `${kpi.todayAttendance.present ?? 0} / ${kpi.todayAttendance.total}`
                : kpi?.todayAttendance
                  ? `${kpi.todayAttendance.rate}%`
                  : (kpi?.totalStudents ? `0 / ${kpi.totalStudents}` : '0 / 0')}
            </span>
            <p className="text-xs text-muted mt-1">
              {kpi?.todayAttendance?.absent !== undefined
                ? `${kpi.todayAttendance.absent} Absent across sections`
                : kpi?.todayAttendance
                  ? 'Present rate across marked sections'
                  : 'No attendance marked today'}
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Staff On Duty</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-violet-subtle text-accent-violet">
              Active Faculty
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-primary">
              {kpi?.totalTeachers !== undefined ? `${kpi.totalTeachers} Faculty` : '0 Faculty'}
            </span>
            <p className="text-xs text-muted mt-1">Teaching Staff on roster</p>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Fee Collection</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-green-subtle text-accent-green">
              {kpi?.fees?.collectionRate !== undefined ? `${kpi.fees.collectionRate}% Rate` : '0% Rate'}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-primary">
              {kpi?.fees
                ? `₹${kpi.fees.totalCollected.toLocaleString('en-IN')}`
                : '₹0'}
            </span>
            <p className="text-xs text-muted mt-1">
              {kpi?.fees
                ? `₹${kpi.fees.totalPending.toLocaleString('en-IN')} Outstanding`
                : '₹0 Pending Due'}
            </p>
          </div>
        </div>
      </div>

      {/* Fee collection (real, per fee structure) + upcoming exams & notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-3xl p-6 border border-border shadow-card">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-primary">Fee Collection by Fee Structure</h3>
              <p className="text-xs text-muted">Collected vs pending</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="text-xs font-bold text-accent-blue hover:underline cursor-pointer"
            >
              Full report →
            </button>
          </div>
          {feeReportQuery.isLoading ? (
            <div className="h-40 rounded-2xl bg-surface-raised animate-pulse" aria-busy="true" />
          ) : (feeReportQuery.data?.feeStructures ?? []).length === 0 ? (
            <div className="h-40 flex items-center justify-center rounded-2xl bg-surface-raised border border-dashed border-border text-xs text-muted">
              {feeReportQuery.isError ? 'Could not load fee data.' : 'No fee structures yet — create one in Finance.'}
            </div>
          ) : (
            <FeeCollectionChart structures={feeReportQuery.data!.feeStructures} theme={chartTheme} />
          )}
        </div>

        <div className="bg-surface rounded-3xl p-6 border border-border shadow-card space-y-5">
          <div>
            <h3 className="text-base font-bold text-primary mb-3">Upcoming Exams</h3>
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-muted">No upcoming exams scheduled.</p>
            ) : (
              <div className="space-y-2">
                {upcomingExams.map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => navigate('/exams')}
                    className="w-full text-left p-3 rounded-2xl bg-surface-raised border border-border hover:border-accent-blue/40 transition-all cursor-pointer"
                  >
                    <p className="text-xs font-bold text-primary">{e.name}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {e.endDate ? ` – ${new Date(e.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                      {e._count?.subjects ? ` • ${e._count.subjects} subjects` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-primary mb-3">Recent Notices</h3>
            {recentNotices.length === 0 ? (
              <p className="text-xs text-muted">No notices published yet.</p>
            ) : (
              <div className="space-y-2">
                {recentNotices.slice(0, 3).map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => navigate('/announcements')}
                    className="w-full text-left p-3 rounded-2xl bg-surface-raised border border-border hover:border-accent-blue/40 transition-all cursor-pointer"
                  >
                    <p className="text-xs font-bold text-primary line-clamp-1">{n.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {typeof n.author === 'string' ? n.author : n.author?.name ?? 'School office'} •{' '}
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
