/**
 * @file SubjectCard.tsx
 * @description Enrolled-subject card for the My Subjects grid (teacher, room, periods, homework).
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import type { MySubject } from '../../../types';
import { dueLabel, getSubjectTheme, isOpenHomework, isUrgent, type HomeworkItem } from './subjectHelpers';

interface SubjectCardProps {
  subject: MySubject;
  homework: HomeworkItem[];
  index: number;
  onOpen: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, homework, index, onOpen }) => {
  const theme = getSubjectTheme(subject.code);
  const open = homework.filter(isOpenHomework).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const urgent = open.find((h) => isUrgent(h));
  const graded = homework.filter((h) => h.status === 'GRADED').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 8) * 0.03 }}
      onClick={onOpen}
      className="bg-surface rounded-3xl p-6 border border-border shadow-card hover:shadow-md hover:border-accent-blue/40 transition-[box-shadow,border-color] duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: theme.color }} />

      <div>
        <div className="flex items-start justify-between mb-4 pt-1 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${theme.gradient} flex items-center justify-center text-white shadow-md shrink-0`}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-primary group-hover:text-accent-blue transition-colors truncate">
                {subject.name}
              </h3>
              <span className="font-mono text-[11px] text-muted font-semibold">{subject.code}</span>
            </div>
          </div>

          {open.length > 0 ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-accent-amber/20 text-accent-amber border border-accent-amber/30 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              <span>{open.length} Due</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent-green-subtle text-accent-green shrink-0">
              All Clear
            </span>
          )}
        </div>

        {urgent && (
          <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent-amber shrink-0" />
            <span className="font-bold shrink-0">{dueLabel(urgent)}:</span>
            <span className="truncate">{urgent.title}</span>
          </div>
        )}

        <div className="py-3 border-y border-border space-y-1.5 text-xs text-secondary">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Faculty In-charge:</span>
            <span className="font-bold text-primary truncate">{subject.teacher?.name ?? 'To be assigned'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Classroom / Lab:</span>
            <span className="font-medium text-secondary truncate">{subject.rooms.join(', ') || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Weekly Lectures:</span>
            <span className="font-semibold text-secondary">
              {subject.weeklyPeriods > 0 ? `${subject.weeklyPeriods} Periods` : 'Not scheduled'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted font-medium">
          {homework.length} Task{homework.length === 1 ? '' : 's'} • {graded} Graded
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-surface-raised hover:bg-accent-blue hover:text-white text-primary font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm border border-border"
        >
          <span>Enter Classroom</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
