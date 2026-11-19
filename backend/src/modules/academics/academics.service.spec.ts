import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/prisma.js', () => ({
  prisma: {
    student: { findFirst: vi.fn() },
    classSubject: { findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../db/prisma.js';
import { AcademicsService } from './academics.service.js';

const db = vi.mocked(prisma);

const teacher = (id: string, name: string) => ({
  id,
  designation: 'PGT',
  user: { name, email: `${id}@school.edu` },
});
const subject = (id: string, name: string, code: string) => ({ id, name, code, type: 'CORE' });

describe('AcademicsService.getStudentSubjects', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 when the user has no student profile in the tenant', async () => {
    db.student.findFirst.mockResolvedValue(null);
    await expect(AcademicsService.getStudentSubjects('school-1', 'user-1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns no subjects when the student is not enrolled', async () => {
    db.student.findFirst.mockResolvedValue({ id: 'stu-1', enrollments: [] } as never);
    await expect(AcademicsService.getStudentSubjects('school-1', 'user-1')).resolves.toEqual({
      studentId: 'stu-1',
      enrollment: null,
      subjects: [],
    });
    expect(db.classSubject.findMany).not.toHaveBeenCalled();
  });

  it('merges class subjects with timetable periods, rooms and teachers', async () => {
    db.student.findFirst.mockResolvedValue({
      id: 'stu-1',
      enrollments: [
        {
          classId: 'class-10',
          sectionId: 'sec-a',
          rollNumber: '1001',
          class: { name: 'Class 10' },
          section: { name: 'A', roomNumber: 'Room 101' },
        },
      ],
    } as never);
    db.classSubject.findMany.mockResolvedValue([
      { subjectId: 'math', subject: subject('math', 'Mathematics', 'MATH101'), teacher: teacher('t1', 'Amit') },
      { subjectId: 'sci', subject: subject('sci', 'Science', 'SCI101'), teacher: null },
    ] as never);
    db.timetable.findMany.mockResolvedValue([
      { subjectId: 'math', roomNumber: 'Room 101', subject: subject('math', 'Mathematics', 'MATH101'), teacher: teacher('t1', 'Amit') },
      { subjectId: 'math', roomNumber: 'Room 101', subject: subject('math', 'Mathematics', 'MATH101'), teacher: teacher('t1', 'Amit') },
      { subjectId: 'sci', roomNumber: 'Lab 1', subject: subject('sci', 'Science', 'SCI101'), teacher: teacher('t2', 'Priya') },
      // Scheduled but not linked as a class subject — still shown
      { subjectId: 'cs', roomNumber: null, subject: subject('cs', 'Computer Science', 'CS101'), teacher: null },
    ] as never);

    const result = await AcademicsService.getStudentSubjects('school-1', 'user-1');

    // Queries stay inside the tenant and the student's own section — no roster
    expect(db.classSubject.findMany.mock.calls[0][0]!.where).toEqual({ schoolId: 'school-1', classId: 'class-10' });
    expect(db.timetable.findMany.mock.calls[0][0]!.where).toEqual({ schoolId: 'school-1', sectionId: 'sec-a' });

    expect(result.enrollment).toMatchObject({ className: 'Class 10', sectionName: 'A', rollNumber: '1001' });
    expect(result.subjects.map((s) => s.name)).toEqual(['Computer Science', 'Mathematics', 'Science']);

    const math = result.subjects.find((s) => s.id === 'math')!;
    expect(math).toMatchObject({ weeklyPeriods: 2, rooms: ['Room 101'], teacher: { name: 'Amit' } });

    // Falls back to the timetable teacher when the class subject has none
    const sci = result.subjects.find((s) => s.id === 'sci')!;
    expect(sci.teacher).toMatchObject({ name: 'Priya' });

    const cs = result.subjects.find((s) => s.id === 'cs')!;
    expect(cs).toMatchObject({ weeklyPeriods: 1, rooms: [], teacher: null });
  });
});
