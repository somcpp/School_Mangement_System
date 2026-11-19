/**
 * @file SubjectClassroomPage.tsx
 * @description Full-page classroom for one enrolled subject (/my-subjects/:subjectId):
 * homework with real submissions, exam schedule & scores, and teacher contact.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock, FileText, MapPin, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyAssignments, useMySubjects } from '../hooks';
import {
  AssignmentsTab,
  SubmitHomeworkModal,
  TeacherTab,
  TestsTab,
  dueLabel,
  getSubjectTheme,
  isOpenHomework,
  sortHomework,
  toHomework,
  type HomeworkItem,
} from '../components/features/subjects';

type Tab = 'ASSIGNMENTS' | 'TESTS' | 'TEACHER';

export const SubjectClassroomPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const subjectsQuery = useMySubjects();
  const assignmentsQuery = useMyAssignments();
  const [activeTab, setActiveTab] = useState<Tab>('ASSIGNMENTS');
  const [submitting, setSubmitting] = useState<HomeworkItem | null>(null);

  const data = subjectsQuery.data;
  const subject = data?.subjects.find((s) => s.id === subjectId);

  const homework = useMemo(
    () => (assignmentsQuery.data ?? []).filter((a) => a.subjectId === subjectId).map((a) => toHomework(a)),
    [assignmentsQuery.data, subjectId]
  );
  const { open } = sortHomework(homework);

  if (subjectsQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" aria-busy="true">
        <div className="h-10 w-64 rounded-2xl bg-surface-raised animate-pulse" />
        <div className="h-56 rounded-3xl bg-surface-raised animate-pulse" />
        <div className="h-14 rounded-2xl bg-surface-raised animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 rounded-3xl bg-surface-raised animate-pulse" />
          <div className="h-48 rounded-3xl bg-surface-raised animate-pulse" />
        </div>
      </div>
    );
  }

  if (!subject || !data?.enrollment) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted" />
        <h1 className="text-lg font-bold text-primary">
          {subjectsQuery.isError ? 'Could not load this classroom' : 'Subject not found'}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {subjectsQuery.isError
            ? 'Please check your connection and try again.'
            : 'This subject is not part of your enrolled class.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/my-subjects')}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-blue text-white font-bold text-xs shadow-md hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Subjects
        </button>
      </div>
    );
  }

  const theme = getSubjectTheme(subject.code);
  const tabButton = (key: Tab, icon: React.ReactNode, label: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
        activeTab === key ? 'bg-accent-blue text-white shadow-card' : 'text-secondary hover:text-primary hover:bg-surface-raised'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb & subject switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/my-subjects')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface border border-border text-secondary hover:text-accent-blue hover:border-accent-blue text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 text-muted group-hover:-translate-x-0.5 transition-transform" />
            <span>All Subjects</span>
          </button>
          <label className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted hidden sm:inline">Switch Subject:</span>
            <select
              value={subject.id}
              onChange={(e) => {
                setActiveTab('ASSIGNMENTS');
                navigate(`/my-subjects/${e.target.value}`);
              }}
              className="px-3 py-1.5 rounded-2xl bg-surface border border-border text-xs font-bold text-secondary shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
            >
              {data.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="text-xs font-semibold text-muted">
          Enrolled in{' '}
          <strong className="text-secondary">
            {data.enrollment.className} - Section {data.enrollment.sectionName}
          </strong>
        </span>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{ background: `linear-gradient(135deg, ${theme.color} 0%, #0369A1 100%)` }}
      >
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">{subject.code}</span>
            {subject.weeklyPeriods > 0 && (
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                {subject.weeklyPeriods} Periods / Week
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{subject.name} Classroom</h1>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-2xl backdrop-blur-md border border-white/20">
              <User className="w-3.5 h-3.5 text-amber-200" />
              <span>
                Instructor: <strong>{subject.teacher?.name ?? 'To be assigned'}</strong>
              </span>
            </div>
            {subject.rooms.length > 0 && (
              <div className="flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-2xl backdrop-blur-md border border-white/20">
                <MapPin className="w-3.5 h-3.5 text-amber-200" />
                <span>{subject.rooms.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 min-w-[240px]">
          {assignmentsQuery.isLoading ? (
            <div className="h-16 rounded-2xl bg-white/15 animate-pulse" />
          ) : open.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-500/25 backdrop-blur-md border border-amber-300/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-200 shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {open.length} Assignment{open.length > 1 ? 's' : ''} Pending
                  </p>
                  <span className="text-[10px] text-amber-100">Next: {dueLabel(open[0])}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ASSIGNMENTS');
                  setSubmitting(open[0]);
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-sm hover:bg-amber-50 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Submit Now
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-300/30 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>All Homework Caught Up!</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-surface rounded-2xl p-2 border border-border shadow-card flex items-center gap-2 overflow-x-auto" role="tablist">
        {tabButton(
          'ASSIGNMENTS',
          <FileText className="w-4 h-4" />,
          <>
            <span>Assignments &amp; Homework</span>
            {open.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'ASSIGNMENTS' ? 'bg-white text-accent-blue' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {open.length} Due
              </span>
            )}
          </>
        )}
        {tabButton('TESTS', <Award className="w-4 h-4" />, <span>Tests &amp; Results</span>)}
        {tabButton('TEACHER', <User className="w-4 h-4" />, <span>Teacher</span>)}
      </div>

      {activeTab === 'ASSIGNMENTS' &&
        (assignmentsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
            <div className="h-48 rounded-3xl bg-surface-raised animate-pulse" />
            <div className="h-48 rounded-3xl bg-surface-raised animate-pulse" />
          </div>
        ) : assignmentsQuery.isError ? (
          <div className="p-6 rounded-3xl bg-surface border border-border text-center text-sm text-secondary">
            Homework could not be loaded.{' '}
            <button type="button" onClick={() => assignmentsQuery.refetch()} className="font-bold text-accent-blue cursor-pointer">
              Retry
            </button>
          </div>
        ) : (
          <AssignmentsTab key={subject.id} subjectName={subject.name} items={homework} onSubmit={setSubmitting} />
        ))}
      {activeTab === 'TESTS' && (
        <TestsTab key={subject.id} subject={subject} classId={data.enrollment.classId} studentId={data.studentId} />
      )}
      {activeTab === 'TEACHER' && <TeacherTab subject={subject} schoolName={user?.school?.name} />}

      <AnimatePresence>
        {submitting && isOpenHomework(submitting) && (
          <SubmitHomeworkModal
            item={submitting}
            teacherName={subject.teacher?.name}
            onClose={() => setSubmitting(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
