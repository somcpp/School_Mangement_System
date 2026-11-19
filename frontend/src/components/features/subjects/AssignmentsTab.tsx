/**
 * @file AssignmentsTab.tsx
 * @description Homework tab of a subject classroom: open work first, then a collapsible
 * archive of submitted / graded work with scores and teacher remarks.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FolderCheck,
  Paperclip,
  Upload,
} from 'lucide-react';
import { uploadService } from '../../../services/upload.service';
import { dueLabel, formatDate, isUrgent, sortHomework, type HomeworkItem } from './subjectHelpers';

type Filter = 'ALL' | 'PENDING' | 'DONE';

interface AssignmentsTabProps {
  subjectName: string;
  items: HomeworkItem[];
  onSubmit: (item: HomeworkItem) => void;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ subjectName, items, onSubmit }) => {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [openFeedback, setOpenFeedback] = useState<Record<string, boolean>>({});
  const { open, done } = sortHomework(items);

  const pill = (key: Filter, label: React.ReactNode, active: string) => (
    <button
      type="button"
      onClick={() => {
        setFilter(key);
        if (key === 'DONE') setArchiveOpen(true);
      }}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
        filter === key ? `bg-surface shadow-sm ${active}` : 'text-secondary hover:text-primary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Segmented filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-card">
        <div className="bg-surface-raised p-1 rounded-xl flex items-center gap-1 overflow-x-auto">
          {pill('ALL', <>All Tasks ({items.length})</>, 'text-primary')}
          {pill(
            'PENDING',
            <>
              <span>Pending Deadlines</span>
              {open.length > 0 && (
                <span className="px-1.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">{open.length}</span>
              )}
            </>,
            'text-amber-700'
          )}
          {pill(
            'DONE',
            <>
              <span>Submitted &amp; Graded</span>
              <span className="px-1.5 rounded-full text-[10px] bg-accent-green-subtle text-accent-green font-extrabold">
                {done.length}
              </span>
            </>,
            'text-emerald-700'
          )}
        </div>
        <span className="text-xs text-muted">
          {filter === 'PENDING'
            ? 'Showing only homework requiring submission'
            : filter === 'DONE'
              ? 'Showing your submissions, scores and remarks'
              : 'Nearest deadlines first, archive below'}
        </span>
      </div>

      {/* Open work */}
      {filter !== 'DONE' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Active &amp; Pending Homework ({open.length})
            </h3>
          </div>

          {open.length === 0 ? (
            <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-accent-green-subtle text-accent-green flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-primary">No Pending Homework</h4>
              <p className="text-xs text-muted">You are all caught up on assignments for {subjectName}!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {open.map((h) => {
                const urgent = isUrgent(h);
                const overdue = h.status === 'OVERDUE';
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-surface rounded-3xl p-6 border-2 shadow-card flex flex-col justify-between ${
                      overdue ? 'border-rose-300 dark:border-rose-800' : urgent ? 'border-amber-300 dark:border-amber-700' : 'border-border'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                          Max {h.maxMarks} Marks
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm ${
                            overdue
                              ? 'bg-accent-rose text-white'
                              : urgent
                                ? 'bg-amber-500 text-white'
                                : 'bg-accent-blue-subtle text-accent-blue'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dueLabel(h)}</span>
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-primary">{h.title}</h4>
                      <p className="text-xs text-secondary leading-relaxed">{h.description}</p>
                      {h.attachmentUrl && (
                        <a
                          href={uploadService.getFileUrl(h.attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-blue hover:underline"
                        >
                          <Paperclip className="w-3 h-3" /> Teacher&apos;s attachment
                        </a>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-muted block">Due Date:</span>
                        <strong className="text-xs text-secondary">{formatDate(h.dueDate)}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSubmit(h)}
                        className="px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-card hover:bg-brand-sky-dark transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{overdue ? 'Submit Late' : 'Submit Homework'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Archive */}
      {filter !== 'PENDING' && (
        <div className="bg-surface rounded-3xl border border-border shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setArchiveOpen((v) => !v)}
            className="w-full p-5 flex items-center justify-between bg-surface-raised/70 hover:bg-surface-raised/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-green-subtle text-accent-green flex items-center justify-center shrink-0">
                <FolderCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-primary">Submitted &amp; Graded Work</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-green-subtle text-accent-green">
                    {done.length}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Click to {archiveOpen ? 'collapse' : 'view'} your past submissions, scores and teacher remarks
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm">
              {archiveOpen ? <ChevronUp className="w-4 h-4 text-secondary" /> : <ChevronDown className="w-4 h-4 text-secondary" />}
            </div>
          </button>

          <AnimatePresence>
            {archiveOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-5 border-t border-border space-y-3 overflow-hidden"
              >
                {done.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs">Nothing submitted for {subjectName} yet.</div>
                ) : (
                  done.map((h) => {
                    const feedbackOpen = openFeedback[h.id] ?? false;
                    const graded = h.status === 'GRADED' && h.marksObtained !== undefined;
                    return (
                      <div key={h.id} className="p-4 rounded-2xl bg-surface-raised/80 border border-border space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                graded ? 'bg-accent-green-subtle text-accent-green' : 'bg-accent-blue-subtle text-accent-blue'
                              }`}
                            >
                              {graded ? 'Graded' : 'Awaiting grade'}
                            </span>
                            <h4 className="text-sm font-bold text-primary mt-1">{h.title}</h4>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-muted">
                              {h.submittedAt && <span>Submitted {formatDate(h.submittedAt)}</span>}
                              {h.submissionUrl && (
                                <a
                                  href={uploadService.getFileUrl(h.submissionUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue-subtle text-accent-blue text-[10px] font-bold hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="w-3 h-3" /> View my file
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {graded && (
                              <div className="text-right">
                                <span className="text-base font-extrabold text-accent-green block">
                                  {h.marksObtained} / {h.maxMarks} Marks
                                </span>
                                {h.maxMarks > 0 && (
                                  <span className="text-[10px] text-muted">
                                    Score: {Math.round(((h.marksObtained ?? 0) / h.maxMarks) * 100)}%
                                  </span>
                                )}
                              </div>
                            )}
                            {(h.feedback || h.submissionNote) && (
                              <button
                                type="button"
                                onClick={() => setOpenFeedback((m) => ({ ...m, [h.id]: !feedbackOpen }))}
                                className="px-3 py-1.5 rounded-xl bg-surface border border-border text-secondary hover:text-accent-blue text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <span>{feedbackOpen ? 'Hide' : 'View'} Notes</span>
                                {feedbackOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {feedbackOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-2 overflow-hidden"
                            >
                              {h.feedback && (
                                <div className="p-3.5 rounded-xl bg-accent-green-subtle border border-border text-xs flex items-start gap-2.5">
                                  <Award className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-extrabold text-primary block text-[11px]">
                                      Teacher Feedback{h.teacherName ? ` (${h.teacherName})` : ''}:
                                    </span>
                                    <p className="text-secondary text-xs mt-0.5 italic leading-relaxed">&ldquo;{h.feedback}&rdquo;</p>
                                  </div>
                                </div>
                              )}
                              {h.submissionNote && (
                                <p className="text-[11px] text-muted px-1">
                                  <strong className="text-secondary">Your note:</strong> {h.submissionNote}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
