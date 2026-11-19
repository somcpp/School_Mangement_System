/**
 * @file StudentSubjectsPage.tsx
 * @description Student "My Subjects" portal: enrolled subjects from GET /academics/my-subjects
 * with homework from GET /assignments (scoped server-side to the student's section).
 * Clicking a subject opens its classroom (/my-subjects/:subjectId).
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Award, BookOpen, Calendar, Clock, GraduationCap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyAssignments, useMySubjects } from '../hooks';
import { SubjectCard, dueLabel, isOpenHomework, toHomework, type HomeworkItem } from '../components/features/subjects';

const StatChip: React.FC<{ label: string; value: string; hint: string; icon: React.ReactNode; tone: string }> = ({
  label,
  value,
  hint,
  icon,
  tone,
}) => (
  <div className="bg-surface rounded-3xl p-5 border border-border shadow-card flex items-center justify-between gap-3">
    <div className="min-w-0">
      <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</span>
      <h4 className={`text-2xl font-extrabold mt-1 ${tone}`}>{value}</h4>
      <span className="text-[11px] text-secondary block truncate">{hint}</span>
    </div>
    <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center shrink-0">{icon}</div>
  </div>
);

export const StudentSubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'STUDENT';
  const subjectsQuery = useMySubjects();
  const assignmentsQuery = useMyAssignments();

  const homeworkBySubject = useMemo(() => {
    const map = new Map<string, HomeworkItem[]>();
    for (const a of assignmentsQuery.data ?? []) {
      const h = toHomework(a);
      map.set(h.subjectId, [...(map.get(h.subjectId) ?? []), h]);
    }
    return map;
  }, [assignmentsQuery.data]);

  const allHomework = useMemo(() => [...homeworkBySubject.values()].flat(), [homeworkBySubject]);
  const open = allHomework.filter(isOpenHomework).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const graded = allHomework.filter((h) => h.status === 'GRADED' && h.marksObtained !== undefined && h.maxMarks > 0);
  const avgScore = graded.length
    ? Math.round(graded.reduce((acc, h) => acc + (h.marksObtained! / h.maxMarks) * 100, 0) / graded.length)
    : null;

  const data = subjectsQuery.data;
  const subjects = data?.subjects ?? [];
  const weeklyPeriods = subjects.reduce((acc, s) => acc + s.weeklyPeriods, 0);
  const sectionLabel = data?.enrollment ? `${data.enrollment.className} - Section ${data.enrollment.sectionName}` : null;

  if (!isStudent) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
        <GraduationCap className="w-10 h-10 mx-auto mb-3 text-muted" />
        <h1 className="text-lg font-bold text-primary">My Subjects is for students</h1>
        <p className="text-sm text-secondary mt-1">Use Academics to manage subjects and homework for classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2 flex-wrap">
            <span>My Enrolled Subjects</span>
            {sectionLabel && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-blue-subtle text-accent-blue">
                {sectionLabel}
              </span>
            )}
          </h1>
          <p className="text-xs text-secondary mt-1">
            Submit homework, track deadlines and review your test scores for each subject.
          </p>
        </div>
        {open.length > 0 && (
          <span className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              {open.length} Homework Deadline{open.length === 1 ? '' : 's'} Pending
            </span>
          </span>
        )}
      </div>

      {subjectsQuery.isError ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-500" />
          <h3 className="text-base font-bold text-primary">Could not load your subjects</h3>
          <p className="text-sm text-secondary mt-1">Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              subjectsQuery.refetch();
              assignmentsQuery.refetch();
            }}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : subjectsQuery.isLoading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-surface-raised animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-surface-raised animate-pulse" />
            ))}
          </div>
        </div>
      ) : !data?.enrollment || subjects.length === 0 ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted" />
          <h3 className="text-base font-bold text-primary">
            {data?.enrollment ? 'No subjects assigned to your class yet' : 'You are not enrolled in a section yet'}
          </h3>
          <p className="text-sm text-secondary mt-1 max-w-md mx-auto">
            Your subjects will appear here once the school sets up your class.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatChip
              label="Courses Enrolled"
              value={`${subjects.length} Subjects`}
              hint={sectionLabel ?? ''}
              tone="text-primary"
              icon={<BookOpen className="w-6 h-6 text-accent-blue" />}
            />
            <StatChip
              label="Homework Pending"
              value={assignmentsQuery.isLoading ? '…' : `${open.length} Active`}
              hint={open[0] ? `Next: ${dueLabel(open[0])}` : 'Nothing due'}
              tone="text-accent-amber"
              icon={<Clock className="w-6 h-6 text-accent-amber" />}
            />
            <StatChip
              label="Homework Average"
              value={avgScore !== null ? `${avgScore}%` : '—'}
              hint={graded.length ? `Across ${graded.length} graded task${graded.length === 1 ? '' : 's'}` : 'No graded work yet'}
              tone="text-accent-green"
              icon={<Award className="w-6 h-6 text-accent-green" />}
            />
            <StatChip
              label="Weekly Lectures"
              value={`${weeklyPeriods} Periods`}
              hint="From your class timetable"
              tone="text-accent-violet"
              icon={<Calendar className="w-6 h-6 text-accent-violet" />}
            />
          </div>

          {assignmentsQuery.isError && (
            <div className="p-4 rounded-2xl bg-accent-rose-subtle border border-border text-accent-rose text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Homework could not be loaded — deadlines below may be incomplete.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((s, i) => (
              <SubjectCard
                key={s.id}
                subject={s}
                homework={homeworkBySubject.get(s.id) ?? []}
                index={i}
                onOpen={() => navigate(`/my-subjects/${s.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
