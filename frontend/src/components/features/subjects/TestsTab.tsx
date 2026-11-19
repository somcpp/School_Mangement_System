/**
 * @file TestsTab.tsx
 * @description Tests tab of a subject classroom: this subject's exam date-sheet slots for the
 * student's class (upcoming), and published marks from the student's report cards (past).
 */

import React, { useMemo } from 'react';
import { Award, Calendar, Clock, MapPin } from 'lucide-react';
import { useExamDetailsMany, useExams, useReportCards } from '../../../hooks';
import type { MySubject } from '../../../types';
import { formatDate } from './subjectHelpers';

interface TestsTabProps {
  subject: MySubject;
  classId: string;
  studentId: string;
}

interface TestRow {
  key: string;
  examName: string;
  term?: string;
  date: Date;
  time: string;
  room?: string;
  maxMarks: number;
  passMarks: number;
  result?: { marksObtained: number; grade: string; passed: boolean };
}

export const TestsTab: React.FC<TestsTabProps> = ({ subject, classId, studentId }) => {
  const examsQuery = useExams();
  const examIds = useMemo(() => (examsQuery.data ?? []).map((e) => e.id), [examsQuery.data]);
  const detailQueries = useExamDetailsMany(examIds);
  const reportQueries = useReportCards(examIds, studentId);

  const detailsLoading = examsQuery.isLoading || detailQueries.some((q) => q.isLoading);
  const loadFailed = examsQuery.isError || detailQueries.some((q) => q.isError);

  const rows: TestRow[] = useMemo(() => {
    const list: TestRow[] = [];
    detailQueries.forEach((q, i) => {
      const exam = q.data;
      if (!exam) return;
      const card = reportQueries[i]?.data;
      for (const slot of exam.subjects ?? []) {
        if (slot.classId !== classId || slot.subjectId !== subject.id) continue;
        const res = card?.results.find((r) => r.subjectCode === subject.code);
        list.push({
          key: slot.id,
          examName: exam.name,
          term: exam.term,
          date: new Date(slot.examDate),
          time: [slot.startTime, slot.endTime].filter(Boolean).join(' – '),
          room: slot.roomNumber,
          maxMarks: Number(slot.maxMarks) || 0,
          passMarks: Number(slot.passMarks) || 0,
          result: res ? { marksObtained: res.marksObtained, grade: res.grade, passed: res.status === 'PASSED' } : undefined,
        });
      }
    });
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [detailQueries, reportQueries, classId, subject.id, subject.code]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = rows.filter((r) => r.date.getTime() >= today.getTime() && !r.result);
  const past = rows.filter((r) => r.date.getTime() < today.getTime() || r.result).reverse();

  if (detailsLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-3xl bg-surface-raised animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadFailed && (
        <div className="p-4 rounded-2xl bg-accent-rose-subtle border border-border text-accent-rose text-xs font-bold">
          Some exam schedules could not be loaded. Please refresh to try again.
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 px-1">
          <Calendar className="w-4 h-4 text-accent-blue" />
          <span>Upcoming Scheduled Assessments ({upcoming.length})</span>
        </h3>
        {upcoming.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface border border-border text-center text-xs text-muted">
            No upcoming exams are scheduled for {subject.name}.
          </div>
        ) : (
          upcoming.map((t) => (
            <div
              key={t.key}
              className="p-6 rounded-3xl bg-surface border-2 border-accent-blue/20 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.term && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-accent-blue-subtle text-accent-blue uppercase">
                      {t.term}
                    </span>
                  )}
                  <span className="text-xs text-muted">{formatDate(t.date)}</span>
                </div>
                <h4 className="text-base font-bold text-primary">{t.examName}</h4>
                <div className="flex items-center gap-3 text-[11px] text-muted">
                  {t.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.time}
                    </span>
                  )}
                  {t.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.room}
                    </span>
                  )}
                </div>
              </div>
              <span className="px-4 py-2 rounded-2xl bg-surface-raised font-extrabold text-primary text-sm shrink-0">
                Max Marks: {t.maxMarks}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 px-1">
          <Award className="w-4 h-4 text-accent-green" />
          <span>Past Assessments &amp; Scores ({past.length})</span>
        </h3>
        {past.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface border border-border text-center text-xs text-muted">
            No past assessments for {subject.name} yet.
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-border shadow-card divide-y divide-border">
            {past.map((t) => (
              <div key={t.key} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-primary">{t.examName}</h4>
                  <span className="text-[11px] text-muted">
                    {formatDate(t.date)}
                    {t.term ? ` • ${t.term}` : ''}
                  </span>
                </div>
                {t.result ? (
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        t.result.passed ? 'bg-accent-green-subtle text-accent-green' : 'bg-accent-rose-subtle text-accent-rose'
                      }`}
                    >
                      Grade {t.result.grade || '—'}
                    </span>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-primary block">
                        {t.result.marksObtained} / {t.maxMarks}
                      </span>
                      {t.maxMarks > 0 && (
                        <span className="text-[10px] text-muted">
                          {Math.round((t.result.marksObtained / t.maxMarks) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-muted">Marks not published yet</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
