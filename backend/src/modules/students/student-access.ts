/**
 * @file student-access.ts
 * @description Row-level authorization for student-owned data (profile, report cards, submissions).
 * Staff roles may read any student inside their tenant; a STUDENT may only read their own record
 * and a PARENT only their linked children.
 */

import { UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/apiError.js';

export interface Requester {
  userId: string;
  role: UserRole;
}

const isSelfServiceRole = (role: UserRole) => role === UserRole.STUDENT || role === UserRole.PARENT;

/**
 * Throws 404 (not 403) when the requester may not see the student, so student IDs
 * cannot be probed for existence.
 */
export async function assertCanAccessStudent(
  schoolId: string,
  requester: Requester | undefined,
  studentId: string
): Promise<void> {
  if (!requester || !isSelfServiceRole(requester.role)) return;

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { userId: true, parent: { select: { userId: true } } },
  });

  const allowed =
    !!student &&
    (requester.role === UserRole.STUDENT
      ? student.userId === requester.userId
      : student.parent?.userId === requester.userId);

  if (!allowed) throw AppError.notFound('Student not found');
}

/**
 * Resolves the student IDs a self-service requester is allowed to see
 * (own record for STUDENT, linked children for PARENT). Returns null for staff (no restriction).
 */
export async function getAccessibleStudentIds(
  schoolId: string,
  requester: Requester | undefined
): Promise<string[] | null> {
  if (!requester || !isSelfServiceRole(requester.role)) return null;

  const students = await prisma.student.findMany({
    where:
      requester.role === UserRole.STUDENT
        ? { schoolId, userId: requester.userId }
        : { schoolId, parent: { userId: requester.userId } },
    select: { id: true },
    take: 20,
  });
  return students.map((s) => s.id);
}
