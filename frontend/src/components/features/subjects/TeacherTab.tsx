/**
 * @file TeacherTab.tsx
 * @description Teacher tab of a subject classroom: assigned faculty, contact and rooms.
 */

import React from 'react';
import { Calendar, Mail, MapPin, UserX } from 'lucide-react';
import type { MySubject } from '../../../types';

export const TeacherTab: React.FC<{ subject: MySubject; schoolName?: string }> = ({ subject, schoolName }) => {
  const teacher = subject.teacher;

  if (!teacher) {
    return (
      <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center max-w-3xl">
        <UserX className="w-10 h-10 mx-auto mb-3 text-muted" />
        <h3 className="text-base font-bold text-primary">No teacher assigned yet</h3>
        <p className="text-sm text-secondary mt-1">
          The school hasn&apos;t assigned a faculty member to {subject.name} for your class.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl p-8 border border-border shadow-card space-y-6 max-w-3xl">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-3xl bg-accent-blue text-white flex items-center justify-center text-2xl font-extrabold shadow-card shrink-0">
          {teacher.name.charAt(0)}
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-primary">{teacher.name}</h3>
          {teacher.designation && <p className="text-xs font-semibold text-accent-blue">{teacher.designation}</p>}
          {schoolName && <p className="text-xs text-secondary">{schoolName} Faculty</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
        <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
          <span className="text-muted font-bold flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-accent-blue" />
            <span>Official Email:</span>
          </span>
          <p className="font-bold text-primary break-all">{teacher.email}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
          <span className="text-muted font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent-blue" />
            <span>Classroom / Lab:</span>
          </span>
          <p className="font-bold text-primary">{subject.rooms.join(', ') || '—'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1 sm:col-span-2">
          <span className="text-muted font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-blue" />
            <span>Weekly Lectures:</span>
          </span>
          <p className="font-bold text-primary">
            {subject.weeklyPeriods > 0 ? `${subject.weeklyPeriods} periods per week` : 'Not on the timetable yet'}
          </p>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end">
        <a
          href={`mailto:${teacher.email}?subject=${encodeURIComponent(`${subject.name} query`)}`}
          className="px-6 py-2.5 rounded-full bg-accent-blue text-white font-bold text-xs shadow-card hover:bg-brand-sky-dark transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Mail className="w-4 h-4" />
          <span>Email {teacher.name.split(' ')[0]}</span>
        </a>
      </div>
    </div>
  );
};
