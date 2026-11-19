import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

vi.mock('../../db/prisma.js', () => ({
  prisma: {
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../db/prisma.js';
import { assertCanAccessStudent, getAccessibleStudentIds } from './student-access.js';

const db = vi.mocked(prisma);

describe('assertCanAccessStudent', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lets staff roles through without a lookup', async () => {
    for (const role of [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN]) {
      await expect(assertCanAccessStudent('school-1', { userId: 'u1', role }, 'stu-1')).resolves.toBeUndefined();
    }
    expect(db.student.findFirst).not.toHaveBeenCalled();
  });

  it('allows a student to read their own record', async () => {
    db.student.findFirst.mockResolvedValue({ userId: 'user-stu', parent: null } as never);
    await expect(
      assertCanAccessStudent('school-1', { userId: 'user-stu', role: UserRole.STUDENT }, 'stu-1')
    ).resolves.toBeUndefined();
    expect(db.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'stu-1', schoolId: 'school-1' } })
    );
  });

  it("rejects a student reading another student's record with 404", async () => {
    db.student.findFirst.mockResolvedValue({ userId: 'someone-else', parent: null } as never);
    await expect(
      assertCanAccessStudent('school-1', { userId: 'user-stu', role: UserRole.STUDENT }, 'stu-2')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows a parent to read their linked child', async () => {
    db.student.findFirst.mockResolvedValue({ userId: 'kid', parent: { userId: 'user-parent' } } as never);
    await expect(
      assertCanAccessStudent('school-1', { userId: 'user-parent', role: UserRole.PARENT }, 'stu-1')
    ).resolves.toBeUndefined();
  });

  it('rejects a parent reading a child that is not theirs', async () => {
    db.student.findFirst.mockResolvedValue({ userId: 'kid', parent: { userId: 'other-parent' } } as never);
    await expect(
      assertCanAccessStudent('school-1', { userId: 'user-parent', role: UserRole.PARENT }, 'stu-1')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 404 when the student does not exist in the tenant', async () => {
    db.student.findFirst.mockResolvedValue(null);
    await expect(
      assertCanAccessStudent('school-1', { userId: 'user-parent', role: UserRole.PARENT }, 'missing')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('getAccessibleStudentIds', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns null (no restriction) for staff', async () => {
    await expect(getAccessibleStudentIds('school-1', { userId: 'u', role: UserRole.TEACHER })).resolves.toBeNull();
  });

  it("scopes a parent to their children's ids", async () => {
    db.student.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never);
    await expect(
      getAccessibleStudentIds('school-1', { userId: 'user-parent', role: UserRole.PARENT })
    ).resolves.toEqual(['a', 'b']);
    expect(db.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: 'school-1', parent: { userId: 'user-parent' } } })
    );
  });
});
