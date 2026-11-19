/**
 * @file TimetablePage.tsx
 * @description Interactive weekly timetable grid backed by the `/timetable` API, with role-scoped
 * views (student/parent see their own section, teachers their periods, admins any section),
 * pastel subject palettes, and a period detail modal.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Download,
  Printer,
  Filter,
  Sparkles,
  BookOpen,
  MapPin,
  User,
  X,
  ChevronRight,
  GraduationCap,
  Plus,
  CheckCircle2,
  AlertCircle,
  CalendarX2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClasses, useSubjects, useAcademicYears, useTeachers } from '../hooks';
import {
  useTimetable,
  useParentClassScope,
  useCreateTimetableEntry,
  type ClassScope,
} from '../hooks/useTimetable';
import { SCHOOL_DAYS, type DayOfWeek, type TimetableEntry, type TimetableFilters } from '../services';

interface PeriodSlot {
  subjectId: string;
  periodNum: number;
  time: string;
  durationMins: number | null;
  subject: string;
  code: string;
  room: string;
  teacher: string;
  teacherRole?: string;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

/** "13:15" → "01:15 PM" style label used in the grid header. */
const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** "MATH101" / "MATH-10" → "MATH" */
const subjectPrefix = (code: string) => code.toUpperCase().replace(/[-\d\s].*$/, '');

const toSlot = (entry: TimetableEntry): PeriodSlot => {
  const duration = toMinutes(entry.endTime) - toMinutes(entry.startTime);
  return {
    subjectId: entry.subjectId,
    periodNum: entry.periodNumber,
    time: `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
    durationMins: Number.isFinite(duration) && duration > 0 ? duration : null,
    subject: entry.subject?.name ?? 'Subject',
    code: entry.subject?.code ?? '—',
    room: entry.roomNumber || 'TBA',
    teacher: entry.teacher?.user?.name ?? 'Unassigned',
    teacherRole: entry.teacher?.designation ?? undefined,
  };
};


/** Pastel palette per subject family (light + dark variants). */
const getPeriodThemeClasses = (subjectCode: string, isLive: boolean) => {
  const prefix = subjectPrefix(subjectCode);
  switch (prefix) {
    case 'MATH':
      return {
        card: 'bg-sky-50/90 text-sky-950 border-sky-200 hover:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-800/60 dark:hover:border-sky-500',
        badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
      };
    case 'PHY':
    case 'SCI':
      return {
        card: `bg-purple-50/90 text-purple-950 border-purple-200 hover:border-purple-400 dark:bg-purple-950/40 dark:text-purple-100 dark:border-purple-800/60 dark:hover:border-purple-500 ${isLive ? 'ring-2 ring-accent-blue/50' : ''}`,
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
      };
    case 'ENG':
      return {
        card: 'bg-rose-50/90 text-rose-950 border-rose-200 hover:border-rose-400 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800/60 dark:hover:border-rose-500',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
      };
    case 'CHEM':
      return {
        card: 'bg-amber-50/90 text-amber-950 border-amber-200 hover:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800/60 dark:hover:border-amber-500',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      };
    case 'CS':
      return {
        card: 'bg-indigo-50/90 text-indigo-950 border-indigo-200 hover:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-800/60 dark:hover:border-indigo-500',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
      };
    case 'PE':
      return {
        card: 'bg-emerald-50/90 text-emerald-950 border-emerald-200 hover:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800/60 dark:hover:border-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      };
    case 'BIO':
      return {
        card: 'bg-teal-50/90 text-teal-950 border-teal-200 hover:border-teal-400 dark:bg-teal-950/40 dark:text-teal-100 dark:border-teal-800/60 dark:hover:border-teal-500',
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300',
      };
    case 'LIB':
      return {
        card: 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-700/80 dark:hover:border-slate-500',
        badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
      };
    case 'SST':
      return {
        card: 'bg-orange-50/90 text-orange-950 border-orange-200 hover:border-orange-400 dark:bg-orange-950/40 dark:text-orange-100 dark:border-orange-800/60 dark:hover:border-orange-500',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
      };
    case 'ART':
    case 'HIN':
      return {
        card: 'bg-pink-50/90 text-pink-950 border-pink-200 hover:border-pink-400 dark:bg-pink-950/40 dark:text-pink-100 dark:border-pink-800/60 dark:hover:border-pink-500',
        badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300',
      };
    default:
      return {
        card: 'bg-surface-raised border-border text-primary hover:border-border-dark',
        badge: 'bg-accent-blue/10 text-accent-blue',
      };
  }
};

interface SectionOption {
  key: string;
  label: string;
  filters: TimetableFilters;
  classId?: string;
  sectionId?: string;
}

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  // Role isolation: Students and Parents only see their enrolled class timetable
  const isStudent = role === 'STUDENT' || role === 'PARENT';
  const isAdmin = role === 'SCHOOL_ADMIN';
  const teacherId: string | undefined = role === 'TEACHER' ? user?.teacherProfile?.id : undefined;

  // ── Resolve the student's / parent's class scope ────────────────────────────
  const studentEnrollment = role === 'STUDENT' ? user?.studentProfile?.enrollments?.[0] : undefined;
  const parentScopeQuery = useParentClassScope(role === 'PARENT');
  const studentScope: ClassScope | null = useMemo(() => {
    if (role === 'STUDENT') {
      if (!studentEnrollment?.classId || !studentEnrollment?.sectionId) return null;
      return {
        classId: studentEnrollment.classId,
        sectionId: studentEnrollment.sectionId,
        className: studentEnrollment.class?.name,
        sectionName: studentEnrollment.section?.name,
        rollNumber: studentEnrollment.rollNumber,
      };
    }
    if (role === 'PARENT') return parentScopeQuery.data ?? null;
    return null;
  }, [role, studentEnrollment, parentScopeQuery.data]);

  // ── Section switcher for admins & faculty ───────────────────────────────────
  const classesQuery = useClasses();
  const sectionOptions: SectionOption[] = useMemo(() => {
    if (isStudent) return [];
    const options: SectionOption[] = [];
    if (teacherId) {
      options.push({ key: 'mine', label: 'My Periods', filters: { teacherId } });
    }
    for (const cls of classesQuery.data ?? []) {
      for (const sec of cls.sections ?? []) {
        options.push({
          key: sec.id,
          label: `${cls.name} - Section ${sec.name}`,
          filters: { classId: cls.id, sectionId: sec.id },
          classId: cls.id,
          sectionId: sec.id,
        });
      }
    }
    return options;
  }, [isStudent, teacherId, classesQuery.data]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedOption = sectionOptions.find((o) => o.key === selectedKey) ?? sectionOptions[0];

  const filters: TimetableFilters = isStudent
    ? studentScope
      ? { classId: studentScope.classId, sectionId: studentScope.sectionId }
      : {}
    : selectedOption?.filters ?? {};

  const timetableQuery = useTimetable(filters);
  const weekly = timetableQuery.data;

  const [activeSlot, setActiveSlot] = useState<PeriodSlot | null>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [slotSuccess, setSlotSuccess] = useState<string | null>(null);

  // ── Derive grid columns (periods) from the real data ────────────────────────
  const { periodColumns, totalPeriods } = useMemo(() => {
    const byPeriod = new Map<number, { start: string; end: string }>();
    let count = 0;
    for (const day of SCHOOL_DAYS) {
      for (const entry of weekly?.[day] ?? []) {
        count += 1;
        if (!byPeriod.has(entry.periodNumber)) {
          byPeriod.set(entry.periodNumber, { start: entry.startTime, end: entry.endTime });
        }
      }
    }
    const columns = [...byPeriod.entries()]
      .sort(([a], [b]) => a - b)
      .map(([num, t]) => ({ num, label: `${formatTime(t.start)} - ${formatTime(t.end)}` }));
    return { periodColumns: columns, totalPeriods: count };
  }, [weekly]);

  // Current day / time helpers for the TODAY row and LIVE badge
  const now = new Date();
  const jsDay = now.getDay(); // 0 = Sunday
  const todayKey: DayOfWeek | null = jsDay >= 1 && jsDay <= 6 ? SCHOOL_DAYS[jsDay - 1] : null;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const isScopeLoading =
    (role === 'PARENT' && parentScopeQuery.isLoading) || (!isStudent && classesQuery.isLoading);
  const isLoading = isScopeLoading || timetableQuery.isLoading;
  const loadError =
    timetableQuery.error ||
    (role === 'PARENT' ? parentScopeQuery.error : null) ||
    (!isStudent ? classesQuery.error : null);
  const noScope = !isLoading && !loadError && !filters.sectionId && !filters.teacherId;

  const scopeTitle = studentScope?.className
    ? `${studentScope.className}${studentScope.sectionName ? ` - Section ${studentScope.sectionName}` : ''}`
    : 'My Class';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {slotSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{slotSuccess}</span>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXPORT ACTIONS                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span>{isStudent ? 'My Class Timetable' : 'Class Timetable & Schedule'}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-blue-subtle text-accent-blue">
              Weekly
            </span>
          </h1>
          <p className="text-sm text-secondary mt-1">
            {isStudent
              ? 'Your personalized weekly academic schedule with period timings, teacher rooms, and subject classrooms.'
              : 'Weekly class periods, lab sessions, and assigned subject teachers across all school sections.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddSlotModal(true)}
              disabled={!selectedOption?.sectionId}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Period Slot</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-border hover:bg-surface-raised text-secondary font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-secondary" />
            <span>Print Timetable</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            title="Use your browser's 'Save as PDF' print destination"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-card hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROLE-AWARE SECTION CONTROLLER                                         */}
      {/* ========================================================================= */}
      {isStudent ? (
        /* Dedicated Student Banner: Strictly locks timetable to student's enrolled section */
        <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/80 p-5 rounded-3xl border border-sky-100 dark:border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue text-white flex items-center justify-center shadow-glow-sky shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-primary">
                  {scopeTitle} • {role === 'PARENT' ? `${studentScope?.studentName ?? 'Child'}'s Schedule` : 'My Schedule'}
                </h3>
                {studentScope?.rollNumber && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-violet-subtle text-accent-violet">
                    Roll No: {studentScope.rollNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-1">
                {totalPeriods > 0 ? `${totalPeriods} Periods / Week` : 'Weekly schedule for your enrolled section'}
              </p>
            </div>
          </div>

          {role === 'STUDENT' && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => navigate('/my-subjects')}
                className="px-4 py-2 rounded-2xl bg-surface border border-sky-200 dark:border-border text-accent-blue font-bold text-xs hover:bg-surface-raised transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-accent-blue" />
                <span>Go to My Subjects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Admin & Faculty Section Switcher */
        <div className="bg-surface p-4 rounded-3xl border border-border shadow-card flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted" />
            <span className="text-xs font-bold text-secondary mr-1">Select Section:</span>
            {classesQuery.isLoading && (
              <span className="h-8 w-40 rounded-2xl bg-surface-raised animate-pulse" />
            )}
            {sectionOptions.map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => setSelectedKey(opt.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  selectedOption?.key === opt.key
                    ? 'bg-accent-blue text-white shadow-card'
                    : 'bg-surface-raised text-secondary hover:bg-surface-raised'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted font-medium">
            {periodColumns.length > 0 ? `Viewing ${periodColumns.length} Daily Periods` : 'No periods scheduled'}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WEEKLY TIMETABLE GRID                                                  */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-card space-y-3" aria-busy="true">
          <div className="h-10 rounded-2xl bg-surface-raised animate-pulse" />
          {SCHOOL_DAYS.map((d) => (
            <div key={d} className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface-raised animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-500" />
          <h3 className="text-base font-bold text-primary">Could not load the timetable</h3>
          <p className="text-sm text-secondary mt-1">Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              timetableQuery.refetch();
              if (role === 'PARENT') parentScopeQuery.refetch();
              if (!isStudent) classesQuery.refetch();
            }}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : noScope || periodColumns.length === 0 ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
          <CalendarX2 className="w-10 h-10 mx-auto mb-3 text-muted" />
          <h3 className="text-base font-bold text-primary">
            {noScope
              ? isStudent
                ? 'You are not enrolled in a section yet'
                : 'No classes or sections set up yet'
              : 'No periods scheduled for this selection'}
          </h3>
          <p className="text-sm text-secondary mt-1 max-w-md mx-auto">
            {noScope
              ? isStudent
                ? 'Your timetable will appear here once the school assigns you to a class section.'
                : 'Create classes and sections in Academics to start building timetables.'
              : isAdmin
                ? 'Add the first period slot to start building this section’s weekly timetable.'
                : 'The school has not published a timetable for this selection yet.'}
          </p>
          {isAdmin && !noScope && selectedOption?.sectionId && (
            <button
              type="button"
              onClick={() => setShowAddSlotModal(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Period Slot</span>
            </button>
          )}
          {isAdmin && noScope && (
            <button
              type="button"
              onClick={() => navigate('/academics')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
            >
              <span>Go to Academics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr>
              <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-secondary bg-surface-raised/80 rounded-l-2xl w-36">
                Day / Period
              </th>
              {periodColumns.map((col, i) => (
                <th
                  key={col.num}
                  className={`py-3.5 px-3 text-xs font-extrabold uppercase tracking-wider text-secondary bg-surface-raised/80 text-center ${
                    i === periodColumns.length - 1 ? 'rounded-r-2xl' : ''
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-primary">
                    <Clock className="w-3.5 h-3.5 text-accent-blue" />
                    <span>Period {col.num}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted block mt-0.5">{col.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SCHOOL_DAYS.map((day) => {
              const isToday = day === todayKey;
              const dayEntries = weekly?.[day] ?? [];

              return (
                <tr
                  key={day}
                  className={`transition-colors ${
                    isToday ? 'bg-sky-50/30 dark:bg-sky-950/20 font-medium' : 'hover:bg-surface-raised/40'
                  }`}
                >
                  {/* Day Column */}
                  <td className="py-4 px-4 font-bold text-sm text-primary align-middle">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${isToday ? 'text-accent-blue' : 'text-muted'}`} />
                      <span className={isToday ? 'text-accent-blue font-extrabold' : ''}>{DAY_LABELS[day]}</span>
                    </div>
                    {isToday && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-accent-blue-subtle text-accent-blue">
                        TODAY
                      </span>
                    )}
                  </td>

                  {/* Period Slots */}
                  {periodColumns.map((col) => {
                    const entry = dayEntries.find((e) => e.periodNumber === col.num);
                    if (!entry) {
                      return (
                        <td key={col.num} className="p-2 align-top">
                          <div className="p-3.5 h-full min-h-[92px] rounded-2xl border border-dashed border-border flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-muted">
                            Free
                          </div>
                        </td>
                      );
                    }

                    const period = toSlot(entry);
                    const isLivePeriod =
                      isToday && nowMins >= toMinutes(entry.startTime) && nowMins < toMinutes(entry.endTime);
                    const theme = getPeriodThemeClasses(period.code, isLivePeriod);

                    return (
                      <td key={col.num} className="p-2 align-top">
                        <div
                          onClick={() => setActiveSlot(period)}
                          className={`p-3.5 rounded-2xl border transition-[box-shadow,border-color] duration-200 cursor-pointer relative shadow-sm hover:shadow-md hover:border-accent-blue/40 ${theme.card}`}
                        >
                          {/* Live pulse for current period */}
                          {isLivePeriod && (
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-accent-blue text-white shadow-sm animate-pulse flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> LIVE
                            </span>
                          )}

                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold opacity-80">{period.code}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${theme.badge}`}>
                              P{period.periodNum}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs leading-snug tracking-tight line-clamp-1">{period.subject}</h4>

                          <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] opacity-90">
                            <span className="truncate max-w-[85px] font-semibold">
                              {selectedOption?.key === 'mine' && entry.class
                                ? `${entry.class.name}${entry.section ? `-${entry.section.name}` : ''}`
                                : period.teacher}
                            </span>
                            <span className="font-bold px-1.5 py-0.5 rounded bg-surface/80 dark:bg-slate-800 text-primary dark:text-slate-200 border border-border/50 text-[9px]">
                              {period.room}
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PERIOD DETAILS MODAL DIALOG                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSlot && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-border space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md bg-accent-blue">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider">
                      {activeSlot.code} • Period {activeSlot.periodNum}
                    </span>
                    <h3 className="text-lg font-bold text-primary">{activeSlot.subject}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlot(null)}
                  className="p-2 rounded-xl hover:bg-surface-raised text-muted cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details List */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-surface-raised border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <Clock className="w-4 h-4 text-accent-blue" />
                    <span className="font-medium">Period Timing:</span>
                  </div>
                  <span className="font-bold text-primary">
                    {activeSlot.time}
                    {activeSlot.durationMins ? ` (${activeSlot.durationMins} mins)` : ''}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-raised border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <User className="w-4 h-4 text-accent-blue" />
                    <span className="font-medium">Faculty Instructor:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary block">{activeSlot.teacher}</span>
                    {activeSlot.teacherRole && <span className="text-[10px] text-muted">{activeSlot.teacherRole}</span>}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-raised border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <MapPin className="w-4 h-4 text-accent-blue" />
                    <span className="font-medium">Classroom / Lab Location:</span>
                  </div>
                  <span className="font-bold text-primary">{activeSlot.room}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSlot(null)}
                  className="px-5 py-2.5 rounded-full border border-border text-secondary font-bold text-xs hover:bg-surface-raised cursor-pointer"
                >
                  Close
                </button>
                {role === 'STUDENT' && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = activeSlot.subjectId;
                      setActiveSlot(null);
                      navigate(`/my-subjects/${targetId}`);
                    }}
                    className="px-6 py-2.5 rounded-full bg-accent-blue text-white font-bold text-xs shadow-card hover:bg-brand-sky-dark transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open {activeSlot.subject} Classroom</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ADD PERIOD SLOT MODAL (School Admins)                                     */}
      {/* ========================================================================= */}
      {showAddSlotModal && isAdmin && selectedOption?.classId && selectedOption?.sectionId && (
        <AddPeriodSlotModal
          classId={selectedOption.classId}
          sectionId={selectedOption.sectionId}
          sectionLabel={selectedOption.label}
          onClose={() => setShowAddSlotModal(false)}
          onCreated={(msg) => {
            setShowAddSlotModal(false);
            setSlotSuccess(msg);
            setTimeout(() => setSlotSuccess(null), 3500);
          }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Add Period Slot modal — persists via POST /timetable
// ─────────────────────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 bg-surface-raised border border-border rounded-2xl text-xs font-semibold text-primary';

const AddPeriodSlotModal: React.FC<{
  classId: string;
  sectionId: string;
  sectionLabel: string;
  onClose: () => void;
  onCreated: (message: string) => void;
}> = ({ classId, sectionId, sectionLabel, onClose, onCreated }) => {
  const yearsQuery = useAcademicYears();
  const subjectsQuery = useSubjects();
  const teachersQuery = useTeachers();
  const createEntry = useCreateTimetableEntry();
  const [formError, setFormError] = useState<string | null>(null);

  const currentYear = yearsQuery.data?.find((y) => y.isCurrent) ?? yearsQuery.data?.[0];
  const lookupsLoading = yearsQuery.isLoading || subjectsQuery.isLoading || teachersQuery.isLoading;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!currentYear) {
      setFormError('No academic year found. Create one in Academics first.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    const dayOfWeek = fd.get('day') as DayOfWeek;
    const startTime = String(fd.get('startTime'));
    const endTime = String(fd.get('endTime'));
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setFormError('End time must be after start time.');
      return;
    }
    const teacherId = String(fd.get('teacherId') || '');
    const roomNumber = String(fd.get('room') || '').trim();

    createEntry.mutate(
      {
        academicYearId: currentYear.id,
        classId,
        sectionId,
        subjectId: String(fd.get('subjectId')),
        teacherId: teacherId || undefined,
        dayOfWeek,
        periodNumber: Number(fd.get('periodNum')),
        startTime,
        endTime,
        roomNumber: roomNumber || undefined,
      },
      {
        onSuccess: () => onCreated(`Period added to ${DAY_LABELS[dayOfWeek]} schedule!`),
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Could not save the period. Please try again.';
          setFormError(message);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-extrabold text-primary">Schedule New Period Slot</h3>
            <p className="text-xs text-muted mt-0.5">{sectionLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-muted hover:text-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {lookupsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-2xl bg-surface-raised animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Day of Week</label>
                <select name="day" className={inputClass}>
                  {SCHOOL_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Period Number</label>
                <input type="number" name="periodNum" defaultValue={1} min={1} max={12} required className={inputClass} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-primary block mb-1">Subject</label>
              <select name="subjectId" required className={inputClass}>
                {(subjectsQuery.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Start Time</label>
                <input type="time" name="startTime" defaultValue="08:30" required className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1">End Time</label>
                <input type="time" name="endTime" defaultValue="09:15" required className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Assigned Teacher</label>
                <select name="teacherId" className={inputClass}>
                  <option value="">Unassigned</option>
                  {(teachersQuery.data ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Room / Lab</label>
                <input name="room" placeholder="Room 101" className={inputClass} />
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-surface-raised text-secondary font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEntry.isPending || (subjectsQuery.data ?? []).length === 0}
                className="px-5 py-2 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createEntry.isPending ? 'Saving…' : 'Save Period'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
