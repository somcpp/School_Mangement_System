/**
 * @file TeacherCard.tsx
 * @description Faculty profile card displaying photo, designation, department, subjects, and actions.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Mail, Phone } from 'lucide-react';
import type { Teacher } from '../../../types';

interface TeacherCardProps {
  teacher: Teacher;
  index: number;
  onSelect: (teacher: Teacher) => void;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, index, onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 8) * 0.03 }}
      className="bg-surface rounded-3xl p-6 border border-border shadow-card hover:shadow-card transition-all relative flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
{teacher.avatarUrl ? (
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-sky-light shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-accent-blue-subtle text-accent-blue flex items-center justify-center text-lg font-extrabold shrink-0" aria-hidden="true">
              {teacher.name.charAt(0)}
            </div>
          )}
            <div>
              <h3 className="text-base font-bold text-primary">{teacher.name}</h3>
              <p className="text-xs text-accent-blue font-medium">{teacher.designation}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] text-muted font-bold bg-surface-raised px-2 py-0.5 rounded-md">
                  {teacher.employeeId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    teacher.status === 'ACTIVE'
                      ? 'bg-accent-green-subtle text-accent-green'
                      : 'bg-accent-amber-subtle text-accent-amber'
                  }`}
                >
                  {teacher.status === 'ACTIVE' ? 'Active' : 'On Leave'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Department & Qualification */}
        <div className="space-y-2 py-3 border-y border-border/50 text-xs text-secondary">
          {teacher.qualification && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-accent-violet shrink-0" />
              <span className="font-medium">{teacher.qualification}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted shrink-0" />
            <span className="truncate">{teacher.email}</span>
          </div>
          {teacher.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted shrink-0" />
              <span>{teacher.phone}</span>
            </div>
          )}
        </div>

        {/* Assigned Subjects */}
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase text-muted tracking-wider mb-2">
            Subjects Assigned
          </p>
          <div className="flex flex-wrap gap-1.5">
            {teacher.subjects.map((sub, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-xl bg-surface-raised border border-border text-[11px] font-medium text-secondary"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted font-medium">{teacher.joiningDate ? `Joined ${teacher.joiningDate}` : ''}</span>
        <button
          type="button"
          onClick={() => onSelect(teacher)}
          className="px-4 py-1.5 rounded-full bg-surface-raised hover:bg-surface-raised/80 text-secondary text-xs font-bold transition-all cursor-pointer"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
};
