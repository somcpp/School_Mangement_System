/**
 * @file CalendarPage.tsx
 * @description Academic Calendar with a real monthly view populated from live exam schedules
 * and published notices.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  CalendarX2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAnnouncements, useExams } from '../hooks';
import type { NoticeCategory } from '../types';

type EventType = 'EXAM' | NoticeCategory;

interface CalendarEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD (local)
  date: Date;
  title: string;
  type: EventType;
  detail: string;
  href: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_STYLES: Record<string, string> = {
  EXAM: 'bg-accent-violet-subtle text-accent-violet',
  EVENT: 'bg-accent-green-subtle text-accent-green',
  HOLIDAY: 'bg-accent-amber-subtle text-accent-amber',
  URGENT: 'bg-accent-rose-subtle text-accent-rose',
  GENERAL: 'bg-accent-blue-subtle text-accent-blue',
};

const TYPE_LABELS: Record<string, string> = {
  EXAM: 'EXAM',
  EVENT: 'EVENT',
  HOLIDAY: 'HOLIDAY',
  URGENT: 'URGENT',
  GENERAL: 'NOTICE',
};

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Exams can run for weeks; never expand more than this many days per exam. */
const MAX_EXAM_SPAN_DAYS = 31;

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canPostNotice = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const examsQuery = useExams();
  const announcementsQuery = useAnnouncements();

  // ── Normalise exams + notices into calendar events ──────────────────────────
  const events: CalendarEvent[] = useMemo(() => {
    const list: CalendarEvent[] = [];

    for (const exam of examsQuery.data ?? []) {
      if (!exam.startDate) continue;
      const start = startOfDay(new Date(exam.startDate));
      const end = exam.endDate ? startOfDay(new Date(exam.endDate)) : start;
      if (Number.isNaN(start.getTime())) continue;
      const rangeLabel =
        end.getTime() > start.getTime() ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);
      for (let i = 0; i <= MAX_EXAM_SPAN_DAYS; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        if (d.getTime() > end.getTime()) break;
        list.push({
          id: `${exam.id}-${i}`,
          dateKey: toDateKey(d),
          date: d,
          title: exam.name,
          type: 'EXAM',
          detail: rangeLabel,
          href: '/exams',
        });
      }
    }

    for (const notice of announcementsQuery.data ?? []) {
      if (!notice.createdAt) continue;
      const d = startOfDay(new Date(notice.createdAt));
      if (Number.isNaN(d.getTime())) continue;
      list.push({
        id: notice.id,
        dateKey: toDateKey(d),
        date: d,
        title: notice.title,
        type: notice.category && notice.category !== 'ALL' ? notice.category : 'GENERAL',
        detail: notice.author?.name ? `Posted by ${notice.author.name}` : 'School notice',
        href: '/announcements',
      });
    }

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [examsQuery.data, announcementsQuery.data]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.dateKey) ?? [];
      arr.push(ev);
      map.set(ev.dateKey, arr);
    }
    return map;
  }, [events]);

  // ── Month grid ──────────────────────────────────────────────────────────────
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // Agenda: one entry per exam (not per day) + notices, limited to the visible month
  const monthAgenda = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((ev) => {
      if (ev.date.getFullYear() !== year || ev.date.getMonth() !== month) return false;
      const key = ev.type === 'EXAM' ? `exam-${ev.title}-${ev.detail}` : ev.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events, year, month]);

  const shiftMonth = (delta: number) => setViewMonth(new Date(year, month + delta, 1));

  const isLoading = examsQuery.isLoading || announcementsQuery.isLoading;
  const hasError = examsQuery.isError || announcementsQuery.isError;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Academic Events & Calendar</h1>
          <p className="text-sm text-secondary">Examination dates and school notices, straight from your school records.</p>
        </div>
        {canPostNotice && (
          <button
            type="button"
            onClick={() => navigate('/announcements')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue text-white font-semibold text-sm shadow-card hover:bg-brand-sky-dark transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Notice</span>
          </button>
        )}
      </div>

      {hasError && (
        <div className="p-4 rounded-2xl bg-accent-rose-subtle border border-border text-accent-rose text-xs font-bold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Some calendar items could not be loaded.
          </span>
          <button
            type="button"
            onClick={() => {
              examsQuery.refetch();
              announcementsQuery.refetch();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-primary hover:bg-surface-raised transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Monthly Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-surface rounded-3xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-primary">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                  className="px-3 py-2 rounded-xl bg-surface-raised hover:bg-accent-blue-subtle text-secondary text-xs font-bold transition-all cursor-pointer"
                >
                  Today
                </button>
              )}
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="p-2 rounded-xl bg-surface-raised hover:bg-accent-blue-subtle text-secondary transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="p-2 rounded-xl bg-surface-raised hover:bg-accent-blue-subtle text-secondary transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-xs font-bold uppercase tracking-wider text-muted py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2" aria-busy={isLoading}>
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[75px]" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const key = toDateKey(new Date(year, month, day));
              const dayEvents = eventsByDay.get(key) ?? [];
              const isToday = isCurrentMonth && day === today.getDate();
              return (
                <div
                  key={day}
                  className={`min-h-[75px] p-2 rounded-2xl border transition-all flex flex-col gap-1 ${
                    isToday
                      ? 'border-accent-blue bg-accent-blue-subtle/40'
                      : dayEvents.length
                        ? 'border-border bg-surface-raised/50'
                        : 'border-border/40 hover:bg-surface-raised/30'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-accent-blue' : 'text-secondary'}`}>{day}</span>
                  {isLoading ? (
                    day % 6 === 0 && <span className="h-4 rounded-xl bg-surface-raised animate-pulse" />
                  ) : (
                    <>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <button
                          type="button"
                          key={ev.id}
                          title={ev.title}
                          onClick={() => navigate(ev.href)}
                          className={`text-[10px] font-bold px-1.5 py-1 rounded-xl truncate leading-tight text-left cursor-pointer hover:opacity-80 transition-opacity ${
                            TYPE_STYLES[ev.type] ?? TYPE_STYLES.GENERAL
                          }`}
                        >
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] font-bold text-muted">+{dayEvents.length - 2} more</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Agenda (1 col) */}
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-card flex flex-col">
          <h3 className="text-base font-bold text-primary mb-4">{monthLabel.split(' ')[0]} Highlights</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface-raised animate-pulse" />
              ))}
            </div>
          ) : monthAgenda.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <CalendarX2 className="w-10 h-10 text-muted mb-3" />
              <h4 className="text-sm font-bold text-primary">Nothing scheduled this month</h4>
              <p className="text-xs text-secondary mt-1 max-w-[220px]">
                Exams and notices published for {monthLabel} will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[560px] pr-1">
              {monthAgenda.map((ev) => (
                <button
                  type="button"
                  key={ev.id}
                  onClick={() => navigate(ev.href)}
                  className="w-full text-left p-3.5 rounded-2xl bg-surface-raised border border-border space-y-1 hover:border-accent-blue/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLES[ev.type] ?? TYPE_STYLES.GENERAL}`}>
                      {TYPE_LABELS[ev.type] ?? ev.type}
                    </span>
                    <span className="text-xs font-bold text-secondary flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {formatDate(ev.date)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-primary">{ev.title}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="w-3 h-3" />
                    <span>{ev.detail}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
