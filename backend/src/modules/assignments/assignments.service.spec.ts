import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

vi.mock('../../db/prisma.js', () => ({
  prisma: {
    student: { findFirst: vi.fn(), findMany: vi.fn() },
    assignment: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

import { prisma } from '../../db/prisma.js';
import { AssignmentsService } from './assignments.service.js';

const db = vi.mocked(prisma);

describe('AssignmentsService.listAssignments', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.assignment.findMany.mockResolvedValue([] as never);
  });

  it('applies staff filters as given and bounds the result', async () => {
    await AssignmentsService.listAssignments(
      'school-1',
      { classId: 'c1', sectionId: 's1', subjectId: 'sub1' },
      { userId: 'teacher-user', role: UserRole.TEACHER }
    );
    const args = db.assignment.findMany.mock.calls[0][0]!;
    expect(args.where).toEqual({ schoolId: 'school-1', classId: 'c1', sectionId: 's1', subjectId: 'sub1' });
    expect(args.take).toBe(100);
    expect(args.include).not.toHaveProperty('submissions');
  });

  it("forces a student onto their own section and includes only their submission", async () => {
    db.student.findFirst.mockResolvedValue({
      id: 'stu-1',
      enrollments: [{ classId: 'own-class', sectionId: 'own-section' }],
    } as never);

    await AssignmentsService.listAssignments(
      'school-1',
      { classId: 'other-class', sectionId: 'other-section' },
      { userId: 'student-user', role: UserRole.STUDENT }
    );

    const args = db.assignment.findMany.mock.calls[0][0]!;
    expect(args.where).toEqual({ schoolId: 'school-1', classId: 'own-class', sectionId: 'own-section' });
    expect(args.include).toMatchObject({ submissions: { where: { studentId: 'stu-1' }, take: 1 } });
  });

  it('returns an empty list for a student without an active enrollment', async () => {
    db.student.findFirst.mockResolvedValue({ id: 'stu-1', enrollments: [] } as never);
    const result = await AssignmentsService.listAssignments(
      'school-1',
      {},
      { userId: 'student-user', role: UserRole.STUDENT }
    );
    expect(result).toEqual([]);
    expect(db.assignment.findMany).not.toHaveBeenCalled();
  });
});

describe('AssignmentsService.getAssignmentById', () => {
  beforeEach(() => vi.resetAllMocks());

  it("only returns the requesting student's own submission", async () => {
    db.student.findMany.mockResolvedValue([{ id: 'stu-1' }] as never);
    db.assignment.findFirst.mockResolvedValue({ id: 'a1', submissions: [] } as never);

    await AssignmentsService.getAssignmentById('school-1', 'a1', {
      userId: 'student-user',
      role: UserRole.STUDENT,
    });

    const args = db.assignment.findFirst.mock.calls[0][0]!;
    expect(args.where).toEqual({ id: 'a1', schoolId: 'school-1' });
    expect((args.include as any).submissions.where).toEqual({ studentId: { in: ['stu-1'] } });
  });

  it('returns every submission to staff', async () => {
    db.assignment.findFirst.mockResolvedValue({ id: 'a1', submissions: [] } as never);
    await AssignmentsService.getAssignmentById('school-1', 'a1', { userId: 't', role: UserRole.TEACHER });
    const args = db.assignment.findFirst.mock.calls[0][0]!;
    expect((args.include as any).submissions.where).toBeUndefined();
  });

  it('throws 404 for an assignment outside the tenant', async () => {
    db.assignment.findFirst.mockResolvedValue(null);
    await expect(
      AssignmentsService.getAssignmentById('school-1', 'nope', { userId: 't', role: UserRole.TEACHER })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
