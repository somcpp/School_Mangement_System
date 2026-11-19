/**
 * @file StudentDashboardView.tsx
 * @description Student dashboard on real data: own attendance, homework from the student's
 * section, next exam, latest report card (average + subject marks), today's timetable and
 * recent teacher feedback on graded homework.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, ChevronRight, Clock, GraduationCap, MessageSquareQuote, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { useExams, useMyAssignments, useReportCard, useStudentAttendance, useTimetable } from '../../../hooks';
import { SCHOOL_DAYS } from '../../../services/timetable.service';
import { getChartTheme } from '../reports/chartTheme';
import { dueLabel, formatDate, isOpenHomework, isUrgent, toHomework } from '../subjects/subjectHelpers';

interface StudentDashboardViewProps {
  user: any;
}

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Hello';
};

const DAY_MS = 24 * 60 * 60 * 1000;
const toMins = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const StatCard: React.FC<{
  label: string;
  badge?: React.ReactNode;
  value: React.ReactNode;
  hint: string;
  onClick?: () => void;
}> = ({ label, badge, value, hint, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-surface rounded-3xl p-5 border border-border shadow-card flex flex-col justify-between ${
      onClick ? 'cursor-pointer hover:border-accent-violet transition-all hover:shadow-md' : ''
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-muted uppercase tracking-wider">{label}</span>
      {badge}
    </div>
    <div className="mt-3">
      <span className="text-3xl font-extrabold text-primary">{value}</span>
      <p className="text-xs text-secondary mt-1 truncate">{hint}</p>
    </div>
  </div>
);

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const chartTheme = getChartTheme(resolvedTheme === 'dark' ? 'dark' : 'light');

  const studentId: string = user?.studentProfile?.id ?? '';
  const enrollment = user?.studentProfile?.enrollments?.[0];
  const now = new Date();

  // ── Queries ──
  const attendanceQuery = useStudentAttendance(studentId);
  const assignmentsQuery = useMyAssignments();
  const examsQuery = useExams();
  const timetableQuery = useTimetable({ classId: enrollment?.classId, sectionId: enrollment?.sectionId });

  // Latest exam that has started — its report card drives the average and the chart
  const exams = examsQuery.data ?? [];
  const latestStarted = exams.find((e) => new Date(e.startDate).getTime() <= now.getTime());
  const reportQuery = useReportCard(latestStarted?.id, studentId || undefined);
  const report = reportQuery.data;

  // ── Derived ──
  const attendance = attendanceQuery.data?.summary;
  const hasAttendance = (attendance?.totalDays ?? 0) > 0;

  const homework = useMemo(() => (assignmentsQuery.data ?? []).map((a) => toHomework(a)), [assignmentsQuery.data]);
  const open = homework.filter(isOpenHomework).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const dueSoon = open.filter((h) => isUrgent(h)).length;
  const feedback = homework
    .filter((h) => h.status === 'GRADED' && h.feedback)
    .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0))
    .slice(0, 3);
  const subjectNameById = new Map((assignmentsQuery.data ?? []).map((a) => [a.subjectId, a.subject?.name ?? 'Subject']));

  const upcomingExam = exams
    .filter((e) => new Date(e.endDate || e.startDate).getTime() >= now.getTime() - DAY_MS)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  const examDays = upcomingExam ? Math.ceil((new Date(upcomingExam.startDate).getTime() - now.getTime()) / DAY_MS) : null;

  const todayKey = now.getDay() >= 1 && now.getDay() <= 6 ? SCHOOL_DAYS[now.getDay() - 1] : null;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const periodsToday = (todayKey ? (timetableQuery.data?.[todayKey] ?? []) : []).map((e) => ({
    id: e.id,
    period: e.periodNumber,
    time: `${e.startTime} - ${e.endTime}`,
    subject: e.subject?.name ?? 'Subject',
    subjectId: e.subjectId,
    teacher: e.teacher?.user?.name ?? '—',
    room: e.roomNumber || '—',
    current: nowMins >= toMins(e.startTime) && nowMins < toMins(e.endTime),
  }));
  const livePeriod = periodsToday.find((p) => p.current);

  const marks = (report?.results ?? []).map((r) => ({ subject: r.subjectCode || r.subjectName, name: r.subjectName, score: r.percentage }));

  const sectionLabel = enrollment?.class?.name
    ? `${enrollment.class.name}-${enrollment.section?.name ?? ''}`
    : 'Not enrolled';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] p-8 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-sky-50">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>
              {sectionLabel}
              {enrollment?.rollNumber ? ` • Roll No: ${enrollment.rollNumber}` : ''} • {user?.school?.name || 'SchoolHub'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            {getTimeGreeting()}, {user?.name || 'Student'}! 📚
          </h2>
          <p className="text-xs sm:text-sm text-sky-50 font-medium">
            Your timetable, homework deadlines and exam results in one place.
          </p>
          {user?.studentProfile?.admissionNo && (
            <span className="inline-block bg-white/15 px-3 py-1 rounded-full border border-white/20 text-xs">
              Admission No: {user.studentProfile.admissionNo}
            </span>
          )}
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/my-subjects')}
            className="px-5 py-3 rounded-2xl bg-white text-sky-700 font-bold text-xs shadow-md hover:bg-sky-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>My Subjects &amp; Homework</span>
          </button>
          {report && (
            <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center text-center p-2">
              <GraduationCap className="w-7 h-7 text-amber-200 mb-0.5" />
              <span className="text-lg font-bold">{report.summary.overallGrade || '—'}</span>
              <span className="text-[10px] text-sky-50 font-medium truncate max-w-full">{report.exam.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="My Attendance"
          badge={
            hasAttendance && (
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  attendance!.percentage >= 75 ? 'bg-accent-green-subtle text-accent-green' : 'bg-accent-rose-subtle text-accent-rose'
                }`}
              >
                {attendance!.percentage >= 75 ? 'Safe ≥75%' : 'Below 75%'}
              </span>
            )
          }
          value={attendanceQuery.isLoading ? '…' : hasAttendance ? `${attendance!.percentage}%` : '—'}
          hint={hasAttendance ? `${attendance!.presentDays} / ${attendance!.totalDays} days attended` : 'No attendance recorded yet'}
        />
        <StatCard
          label="Homework Due"
          badge={
            dueSoon > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-amber-subtle text-accent-amber">
                {dueSoon} due soon
              </span>
            )
          }
          value={assignmentsQuery.isLoading ? '…' : `${open.length} Pending`}
          hint={open[0] ? `Next: ${open[0].title} (${dueLabel(open[0])})` : 'All caught up'}
          onClick={() => navigate('/my-subjects')}
        />
        <StatCard
          label="Upcoming Exam"
          badge={
            upcomingExam && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-violet-subtle text-accent-violet flex items-center gap-1">
                {examDays !== null && examDays > 0 ? `In ${examDays} day${examDays === 1 ? '' : 's'}` : 'Ongoing'}
                <ChevronRight className="w-3 h-3" />
              </span>
            )
          }
          value={<span className="text-xl font-bold">{examsQuery.isLoading ? '…' : (upcomingExam?.name ?? 'None scheduled')}</span>}
          hint={upcomingExam ? `Starts ${formatDate(new Date(upcomingExam.startDate))} • View schedule →` : 'Check the Exams page for results'}
          onClick={() => navigate('/exams')}
        />
        <StatCard
          label="Latest Result"
          badge={
            report && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-blue-subtle text-accent-blue">
                Grade {report.summary.overallGrade || '—'}
              </span>
            )
          }
          value={reportQuery.isLoading ? '…' : report ? `${report.summary.overallPercentage}%` : '—'}
          hint={report ? report.exam.name : 'No published marks yet'}
          onClick={() => navigate('/exams')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's schedule */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-card">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-primary">Today’s Period Schedule</h3>
                <p className="text-xs text-muted font-medium">
                  {now.toLocaleDateString('en-IN', { weekday: 'long' })} • {sectionLabel} Timetable
                </p>
              </div>
              <div className="flex items-center gap-2">
                {livePeriod && (
                  <span className="text-xs font-bold text-accent-blue bg-accent-blue-subtle px-3 py-1 rounded-full">
                    Period {livePeriod.period} Ongoing
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/timetable')}
                  className="hidden sm:flex items-center gap-1 text-xs font-bold text-accent-blue hover:underline cursor-pointer"
                >
                  <span>My Timetable</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {timetableQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-surface-raised animate-pulse" />
                ))}
              </div>
            ) : periodsToday.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-surface-raised border border-dashed border-border text-xs text-muted">
                No classes scheduled today.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {periodsToday.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/my-subjects/${p.subjectId}`)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                      p.current
                        ? 'bg-accent-blue-subtle border-brand-sky text-accent-blue shadow-sm'
                        : 'bg-surface-raised border-border text-secondary hover:bg-surface-raised/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        Period {p.period} • {p.time}
                      </span>
                      {p.current && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-blue text-white">LIVE</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-primary">{p.subject}</h4>
                    <div className="flex items-center justify-between text-xs text-secondary mt-2">
                      <span>{p.teacher}</span>
                      <span className="font-medium text-muted">{p.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject marks — single series, so one hue and no legend */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-card">
            <div className="flex items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="text-base font-bold text-primary">Subject-wise Marks (% Score)</h3>
                <p className="text-xs text-muted font-medium">{report ? report.exam.name : 'Latest examination'}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/exams')}
                className="text-xs font-bold text-accent-blue hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Report Card</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reportQuery.isLoading ? (
              <div className="h-56 rounded-2xl bg-surface-raised animate-pulse" aria-busy="true" />
            ) : marks.length === 0 ? (
              <div className="h-56 flex items-center justify-center rounded-2xl bg-surface-raised border border-dashed border-border text-xs text-muted">
                Marks will appear here once your teachers publish them.
              </div>
            ) : (
              <div className="h-56" role="img" aria-label="Marks percentage by subject">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axis }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <Tooltip
                      cursor={{ fill: chartTheme.grid, opacity: 0.35 }}
                      formatter={(v) => [`${v}%`, 'Score']}
                      labelFormatter={(_l, payload) => payload?.[0]?.payload?.name ?? ''}
                      contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderRadius: 12, border: 'none', fontSize: 12 }}
                      itemStyle={{ color: chartTheme.tooltipText }}
                      labelStyle={{ color: chartTheme.tooltipText, fontWeight: 700 }}
                    />
                    <Bar dataKey="score" fill={chartTheme.series1} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Homework */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-primary">Homework &amp; Tasks</h3>
                <p className="text-xs text-muted">Nearest deadlines first</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/my-subjects')}
                className="px-3 py-1.5 rounded-xl bg-accent-blue-subtle text-accent-blue hover:opacity-80 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>My Subjects</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {assignmentsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-surface-raised animate-pulse" />)
              ) : open.length === 0 ? (
                <div className="py-6 text-center rounded-2xl bg-surface-raised border border-dashed border-border text-xs text-muted">
                  No pending homework. 🎉
                </div>
              ) : (
                open.slice(0, 4).map((h) => (
                  <button
                    type="button"
                    key={h.id}
                    onClick={() => navigate(`/my-subjects/${h.subjectId}`)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isUrgent(h)
                        ? 'bg-amber-50/50 border-amber-200 shadow-sm dark:bg-amber-950/30 dark:border-amber-900'
                        : 'bg-surface border-border hover:border-accent-blue shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-raised text-secondary">
                        {subjectNameById.get(h.subjectId)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 ${
                          isUrgent(h) ? 'bg-amber-100 text-amber-900' : 'bg-accent-blue-subtle text-accent-blue'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{dueLabel(h)}</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold mt-1 text-primary">{h.title}</p>
                    <span className="text-[10px] text-secondary font-medium mt-1 block">Due {formatDate(h.dueDate)}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Real teacher feedback */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-card">
            <h3 className="text-base font-bold text-primary mb-3">Teacher Feedback</h3>
            {feedback.length === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-surface-raised border border-dashed border-border text-xs text-muted">
                Feedback on your graded homework will appear here.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {feedback.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-2xl bg-surface-raised border border-border">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-accent-violet" />
                        {h.teacherName ?? 'Teacher'} · {subjectNameById.get(h.subjectId)}
                      </span>
                      {h.marksObtained !== undefined && (
                        <span className="text-[10px] font-bold text-accent-green">
                          {h.marksObtained}/{h.maxMarks}
                        </span>
                      )}
                    </div>
                    <p className="text-secondary leading-relaxed">&ldquo;{h.feedback}&rdquo;</p>
                    <span className="text-[10px] text-muted mt-1 block">{h.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
