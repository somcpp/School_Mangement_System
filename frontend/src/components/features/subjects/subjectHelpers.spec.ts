import { describe, expect, it } from 'vitest';
import type { Assignment } from '../../../types';
import { dueLabel, getSubjectTheme, isUrgent, sortHomework, subjectPrefix, toHomework } from './subjectHelpers';

const NOW = new Date('2026-11-19T10:00:00');

const assignment = (over: Partial<Assignment> = {}): Assignment => ({
  id: 'a1',
  schoolId: 's',
  academicYearId: 'y',
  classId: 'c',
  sectionId: 'sec',
  subjectId: 'math',
  teacherId: 't',
  title: 'Exercise 4.3',
  description: 'Solve 1-8',
  dueDate: '2026-11-24T23:59:00',
  maxMarks: '20' as unknown as number, // Prisma Decimal arrives as a string
  status: 'PUBLISHED',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('subject theme', () => {
  it('derives the prefix from seeded and legacy codes', () => {
    expect(subjectPrefix('MATH101')).toBe('MATH');
    expect(subjectPrefix('MATH-10')).toBe('MATH');
    expect(subjectPrefix('cs101')).toBe('CS');
  });

  it('falls back to a default theme for unknown subjects', () => {
    expect(getSubjectTheme('XYZ900').gradient).toContain('from-blue-400');
  });
});

describe('toHomework', () => {
  it('is PENDING with no submission before the deadline and parses Decimal strings', () => {
    const h = toHomework(assignment(), NOW);
    expect(h.status).toBe('PENDING');
    expect(h.maxMarks).toBe(20);
  });

  it('is OVERDUE with no submission after the deadline', () => {
    expect(toHomework(assignment({ dueDate: '2026-11-10T23:59:00' }), NOW).status).toBe('OVERDUE');
  });

  it('maps submitted and graded submissions', () => {
    const submitted = toHomework(
      assignment({ submissions: [{ id: 's1', assignmentId: 'a1', studentId: 'st', submittedAt: '2026-11-18', status: 'SUBMITTED' }] }),
      NOW
    );
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.marksObtained).toBeUndefined();

    const graded = toHomework(
      assignment({
        submissions: [
          {
            id: 's1',
            assignmentId: 'a1',
            studentId: 'st',
            submittedAt: '2026-11-18',
            status: 'GRADED',
            marksObtained: '18' as unknown as number,
            feedback: 'Great',
          },
        ],
      }),
      NOW
    );
    expect(graded).toMatchObject({ status: 'GRADED', marksObtained: 18, feedback: 'Great' });
  });
});

describe('dueLabel / isUrgent', () => {
  it('describes upcoming and overdue deadlines in days', () => {
    expect(dueLabel(toHomework(assignment({ dueDate: '2026-11-19T23:59:00' }), NOW), NOW)).toBe('Due today');
    expect(dueLabel(toHomework(assignment({ dueDate: '2026-11-20T23:59:00' }), NOW), NOW)).toBe('Due tomorrow');
    expect(dueLabel(toHomework(assignment(), NOW), NOW)).toBe('Due in 5 days');
    expect(dueLabel(toHomework(assignment({ dueDate: '2026-11-17T23:59:00' }), NOW), NOW)).toBe('Overdue by 2 days');
  });

  it('flags open work due within 48 hours as urgent', () => {
    expect(isUrgent(toHomework(assignment({ dueDate: '2026-11-20T23:59:00' }), NOW), NOW)).toBe(true);
    expect(isUrgent(toHomework(assignment(), NOW), NOW)).toBe(false);
  });
});

describe('sortHomework', () => {
  it('orders open work by nearest deadline and finished work by latest submission', () => {
    const items = [
      toHomework(assignment({ id: 'late', dueDate: '2026-11-30' }), NOW),
      toHomework(assignment({ id: 'soon', dueDate: '2026-11-21' }), NOW),
      toHomework(
        assignment({ id: 'old', submissions: [{ id: 'x', assignmentId: 'old', studentId: 's', submittedAt: '2026-11-01' }] }),
        NOW
      ),
      toHomework(
        assignment({ id: 'new', submissions: [{ id: 'y', assignmentId: 'new', studentId: 's', submittedAt: '2026-11-15' }] }),
        NOW
      ),
    ];
    const { open, done } = sortHomework(items);
    expect(open.map((h) => h.id)).toEqual(['soon', 'late']);
    expect(done.map((h) => h.id)).toEqual(['new', 'old']);
  });
});
