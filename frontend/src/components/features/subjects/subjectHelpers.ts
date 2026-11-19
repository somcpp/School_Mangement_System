/**
 * @file subjectHelpers.ts
 * @description Pure helpers for the student subjects portal: per-subject colour theme and the
 * homework view-model derived from API assignments (+ the student's own submission).
 */

import type { Assignment } from '../../../types';

// ── Subject colour theme ──────────────────────────────────────────────────────
// Class names are written out in full so Tailwind can see them at build time.
export interface SubjectTheme {
  color: string;
  gradient: string;
}

const THEMES: Record<string, SubjectTheme> = {
  MATH: { color: '#38BDF8', gradient: 'from-sky-400 to-sky-600' },
  SCI: { color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
  PHY: { color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
  CHEM: { color: '#F59E0B', gradient: 'from-amber-400 to-amber-600' },
  BIO: { color: '#14B8A6', gradient: 'from-teal-400 to-teal-600' },
  ENG: { color: '#F43F5E', gradient: 'from-rose-400 to-rose-600' },
  SST: { color: '#F97316', gradient: 'from-orange-400 to-orange-600' },
  HIN: { color: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  CS: { color: '#6366F1', gradient: 'from-indigo-400 to-indigo-600' },
};
const DEFAULT_THEME: SubjectTheme = { color: '#3B82F6', gradient: 'from-blue-400 to-blue-600' };

/** "MATH101" / "MATH-10" → "MATH" */
export const subjectPrefix = (code: string) => code.toUpperCase().replace(/[-\d\s].*$/, '');

export const getSubjectTheme = (code: string): SubjectTheme => THEMES[subjectPrefix(code)] ?? DEFAULT_THEME;

// ── Homework view-model ──────────────────────────────────────────────────────
export type HomeworkStatus = 'PENDING' | 'OVERDUE' | 'SUBMITTED' | 'GRADED';

export interface HomeworkItem {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: Date;
  maxMarks: number;
  status: HomeworkStatus;
  teacherName?: string;
  attachmentUrl?: string | null;
  submittedAt?: Date;
  submissionNote?: string | null;
  submissionUrl?: string | null;
  marksObtained?: number;
  feedback?: string | null;
}

export const toHomework = (a: Assignment, now: Date = new Date()): HomeworkItem => {
  const submission = a.submissions?.[0];
  const dueDate = new Date(a.dueDate);
  const status: HomeworkStatus = submission
    ? submission.status === 'GRADED'
      ? 'GRADED'
      : 'SUBMITTED'
    : dueDate.getTime() < now.getTime()
      ? 'OVERDUE'
      : 'PENDING';

  return {
    id: a.id,
    subjectId: a.subjectId,
    title: a.title,
    description: a.description,
    dueDate,
    maxMarks: Number(a.maxMarks) || 0,
    status,
    teacherName: a.teacher?.user?.name,
    attachmentUrl: a.attachmentUrl,
    submittedAt: submission ? new Date(submission.submittedAt) : undefined,
    submissionNote: submission?.content ?? null,
    submissionUrl: submission?.attachmentUrl ?? null,
    marksObtained:
      submission?.marksObtained !== null && submission?.marksObtained !== undefined
        ? Number(submission.marksObtained)
        : undefined,
    feedback: submission?.feedback ?? null,
  };
};

export const isOpenHomework = (h: HomeworkItem) => h.status === 'PENDING' || h.status === 'OVERDUE';

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Due today" · "Due tomorrow" · "Due in 3 days" · "Overdue by 2 days" */
export const dueLabel = (h: HomeworkItem, now: Date = new Date()): string => {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(h.dueDate) - startOf(now)) / DAY_MS);
  if (h.status === 'OVERDUE' || days < 0) {
    const late = Math.max(1, -days);
    return `Overdue by ${late} day${late === 1 ? '' : 's'}`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
};

/** Due within 48h (or overdue) — highlighted on cards. */
export const isUrgent = (h: HomeworkItem, now: Date = new Date()) =>
  isOpenHomework(h) && h.dueDate.getTime() - now.getTime() < 2 * DAY_MS;

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Sort open work by nearest deadline, finished work by most recent. */
export const sortHomework = (items: HomeworkItem[]) => {
  const open = items.filter(isOpenHomework).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const done = items
    .filter((h) => !isOpenHomework(h))
    .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
  return { open, done };
};
