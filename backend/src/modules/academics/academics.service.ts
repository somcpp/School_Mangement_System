/**
 * @file academics.service.ts
 * @description Academic structure service handling academic years, classes, sections, subjects, and assignments.
 * All queries are strictly scoped to the tenant `schoolId`.
 */

import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/apiError.js';

export class AcademicsService {
  // ==========================================
  // ACADEMIC YEARS
  // ==========================================

  static async listAcademicYears(schoolId: string) {
    return prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { enrollments: true, exams: true },
        },
      },
    });
  }

  static async createAcademicYear(schoolId: string, data: { name: string; startDate: string | Date; endDate: string | Date; isCurrent?: boolean }) {
    const existing = await prisma.academicYear.findUnique({
      where: { schoolId_name: { schoolId, name: data.name } },
    });
    if (existing) {
      throw AppError.conflict(`Academic year "${data.name}" already exists`);
    }

    return prisma.$transaction(async (tx) => {
      // If setting this as current, reset other academic years
      if (data.isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.create({
        data: {
          schoolId,
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isCurrent: !!data.isCurrent,
        },
      });
    });
  }

  static async setCurrentAcademicYear(schoolId: string, academicYearId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { schoolId },
        data: { isCurrent: false },
      });

      return tx.academicYear.update({
        where: { id: academicYearId },
        data: { isCurrent: true },
      });
    });
  }

  // ==========================================
  // CLASSES & SECTIONS
  // ==========================================

  static async listClasses(schoolId: string) {
    return prisma.class.findMany({
      where: { schoolId },
      orderBy: { numericOrder: 'asc' },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { enrollments: true },
            },
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  static async getClassById(schoolId: string, classId: string) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { enrollments: true } },
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
            section: true,
          },
          take: 100,
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!cls) {
      throw AppError.notFound('Class not found');
    }

    return cls;
  }

  static async createClass(schoolId: string, data: { name: string; numericOrder?: number; initialSections?: string[] }) {
    const existing = await prisma.class.findUnique({
      where: { schoolId_name: { schoolId, name: data.name } },
    });
    if (existing) {
      throw AppError.conflict(`Class "${data.name}" already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const cls = await tx.class.create({
        data: {
          schoolId,
          name: data.name,
          numericOrder: data.numericOrder || 0,
        },
      });

      const sectionsToCreate = data.initialSections?.length ? data.initialSections : ['A'];
      for (const secName of sectionsToCreate) {
        await tx.section.create({
          data: {
            schoolId,
            classId: cls.id,
            name: secName.trim().toUpperCase(),
          },
        });
      }

      return tx.class.findUnique({
        where: { id: cls.id },
        include: { sections: true },
      });
    });
  }

  static async createSection(schoolId: string, data: { classId: string; name: string; roomNumber?: string; capacity?: number }) {
    // Verify class belongs to this school
    const cls = await prisma.class.findFirst({ where: { id: data.classId, schoolId } });
    if (!cls) {
      throw AppError.notFound('Class not found');
    }

    const existing = await prisma.section.findUnique({
      where: { classId_name: { classId: data.classId, name: data.name.toUpperCase() } },
    });
    if (existing) {
      throw AppError.conflict(`Section "${data.name}" already exists in ${cls.name}`);
    }

    return prisma.section.create({
      data: {
        schoolId,
        classId: data.classId,
        name: data.name.toUpperCase(),
        roomNumber: data.roomNumber,
        capacity: data.capacity || 40,
      },
    });
  }

  // ==========================================
  // SUBJECTS
  // ==========================================

  static async listSubjects(schoolId: string) {
    return prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { classSubjects: true } },
      },
    });
  }

  static async createSubject(schoolId: string, data: { name: string; code: string; type?: string }) {
    const existing = await prisma.subject.findUnique({
      where: { schoolId_code: { schoolId, code: data.code.toUpperCase() } },
    });
    if (existing) {
      throw AppError.conflict(`Subject code "${data.code}" already exists`);
    }

    return prisma.subject.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code.toUpperCase(),
        type: data.type || 'CORE',
      },
    });
  }

  static async assignClassSubject(schoolId: string, data: { classId: string; subjectId: string; teacherId?: string }) {
    // Verify class and subject belong to tenant
    const [cls, subject] = await Promise.all([
      prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
      prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
    ]);

    if (!cls || !subject) {
      throw AppError.notFound('Class or Subject not found');
    }

    return prisma.classSubject.upsert({
      where: {
        classId_subjectId: {
          classId: data.classId,
          subjectId: data.subjectId,
        },
      },
      create: {
        schoolId,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId || null,
      },
      update: {
        teacherId: data.teacherId || null,
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });
  }

  /**
   * 1-Click CBSE Starter Pack for newly registered schools
   * Provisions standard Class 1-10 with Sections A & B and Core Subjects
   */
  static async initializeStarterPack(schoolId: string) {
    const defaultSubjects = [
      { name: 'Mathematics', code: 'MATH101', type: 'CORE' },
      { name: 'Science', code: 'SCI101', type: 'CORE' },
      { name: 'English Language & Literature', code: 'ENG101', type: 'CORE' },
      { name: 'Social Science', code: 'SST101', type: 'CORE' },
      { name: 'Hindi', code: 'HIN101', type: 'LANGUAGE' },
      { name: 'Computer Science', code: 'CS101', type: 'ELECTIVE' },
    ];

    const standardClasses = [
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    ];

    return prisma.$transaction(async (tx) => {
      // 1. Create Subjects
      const createdSubjects = [];
      for (const sub of defaultSubjects) {
        const s = await tx.subject.upsert({
          where: { schoolId_code: { schoolId, code: sub.code } },
          update: {},
          create: {
            schoolId,
            name: sub.name,
            code: sub.code,
            type: sub.type as any,
          },
        });
        createdSubjects.push(s);
      }

      // 2. Create Classes & Sections
      const createdClasses = [];
      for (const className of standardClasses) {
        const cls = await tx.class.upsert({
          where: { schoolId_name: { schoolId, name: className } },
          update: {},
          create: {
            schoolId,
            name: className,
            numericOrder: standardClasses.indexOf(className) + 1,
          },
        });

        // Add Section A and B
        await tx.section.upsert({
          where: { classId_name: { classId: cls.id, name: 'A' } },
          update: {},
          create: {
            schoolId,
            classId: cls.id,
            name: 'A',
            capacity: 40,
          },
        });
        await tx.section.upsert({
          where: { classId_name: { classId: cls.id, name: 'B' } },
          update: {},
          create: {
            schoolId,
            classId: cls.id,
            name: 'B',
            capacity: 40,
          },
        });

        // Link core subjects to class
        for (const sub of createdSubjects) {
          await tx.classSubject.upsert({
            where: {
              classId_subjectId: {
                classId: cls.id,
                subjectId: sub.id,
              },
            },
            update: {},
            create: {
              schoolId,
              classId: cls.id,
              subjectId: sub.id,
            },
          });
        }

        createdClasses.push(cls);
      }

      return {
        classesCreated: createdClasses.length,
        subjectsCreated: createdSubjects.length,
        sectionsCreated: createdClasses.length * 2,
      };
    });
  }

  /**
   * Subjects for the signed-in student's active section: teacher, weekly period count and rooms.
   * Deliberately avoids the class roster so students never receive classmates' records.
   */
  static async getStudentSubjects(schoolId: string, userId: string) {
    const student = await prisma.student.findFirst({
      where: { schoolId, userId },
      select: {
        id: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: {
            classId: true,
            sectionId: true,
            rollNumber: true,
            class: { select: { name: true } },
            section: { select: { name: true, roomNumber: true } },
          },
        },
      },
    });
    if (!student) throw AppError.notFound('Student profile not found');

    const enrollment = student.enrollments[0];
    if (!enrollment) return { studentId: student.id, enrollment: null, subjects: [] };

    const teacherSelect = {
      id: true,
      designation: true,
      user: { select: { name: true, email: true } },
    } as const;

    const [classSubjects, periods] = await Promise.all([
      prisma.classSubject.findMany({
        where: { schoolId, classId: enrollment.classId },
        include: { subject: true, teacher: { select: teacherSelect } },
        take: 50,
      }),
      prisma.timetable.findMany({
        where: { schoolId, sectionId: enrollment.sectionId },
        select: { subjectId: true, roomNumber: true, subject: true, teacher: { select: teacherSelect } },
        take: 200,
      }),
    ]);

    type TeacherInfo = (typeof classSubjects)[number]['teacher'];
    const bySubject = new Map<
      string,
      { subject: (typeof classSubjects)[number]['subject']; teacher: TeacherInfo; weeklyPeriods: number; rooms: Set<string> }
    >();

    for (const cs of classSubjects) {
      bySubject.set(cs.subjectId, { subject: cs.subject, teacher: cs.teacher, weeklyPeriods: 0, rooms: new Set() });
    }
    for (const p of periods) {
      const entry =
        bySubject.get(p.subjectId) ??
        { subject: p.subject, teacher: p.teacher, weeklyPeriods: 0, rooms: new Set<string>() };
      entry.weeklyPeriods += 1;
      if (p.roomNumber) entry.rooms.add(p.roomNumber);
      if (!entry.teacher && p.teacher) entry.teacher = p.teacher;
      bySubject.set(p.subjectId, entry);
    }

    const subjects = [...bySubject.values()]
      .map(({ subject, teacher, weeklyPeriods, rooms }) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        type: subject.type,
        weeklyPeriods,
        rooms: [...rooms],
        teacher: teacher
          ? {
              id: teacher.id,
              name: teacher.user.name,
              email: teacher.user.email,
              designation: teacher.designation,
            }
          : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      studentId: student.id,
      enrollment: {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        className: enrollment.class.name,
        sectionName: enrollment.section.name,
        homeRoom: enrollment.section.roomNumber,
        rollNumber: enrollment.rollNumber,
      },
      subjects,
    };
  }
}
