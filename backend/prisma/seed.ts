
/**
 * @file seed.ts
 * @description Database seeder for the platform admin, demo school,
 * academic structure, teachers, students, parents, enrollments and samples.
 */

import {
  UserRole,
  SchoolStatus,
  SubscriptionPlan,
  Gender,
  AttendanceStatus,
  ExamStatus,
  InvoiceStatus,
  PaymentMethod,
  DayOfWeek,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db/prisma.js';

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Seed Platform Super Admin
  const superAdminPasswordHash = await bcrypt.hash(
    'SuperAdmin@Secure123!',
    12,
  );

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {},
    create: {
      email: 'superadmin@platform.com',
      passwordHash: superAdminPasswordHash,
      name: 'Platform Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`✅ Seeded Super Admin: ${superAdmin.email}`);

  // 2. Seed Demo School Tenant
  const school = await prisma.school.upsert({
    where: { code: 'DPA-DELHI' },
    update: {},
    create: {
      name: 'Delhi Public Academy',
      code: 'DPA-DELHI',
      email: 'info@dpa.edu',
      phone: '+91 98765 43210',
      address: 'Sector 14, Rohini, New Delhi',
      website: 'https://dpa.edu',
      status: SchoolStatus.ACTIVE,
      maxStudents: 2000,
    },
  });

  console.log(
    `✅ Seeded Demo School: ${school.name} (Code: ${school.code})`,
  );

  // 3. Seed School Subscription
  const existingSub = await prisma.schoolSubscription.findFirst({
    where: { schoolId: school.id },
  });

  if (!existingSub) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    await prisma.schoolSubscription.create({
      data: {
        schoolId: school.id,
        plan: SubscriptionPlan.PRO,
        status: 'ACTIVE',
        amount: 99.0,
        billingCycle: 'ANNUALLY',
        startDate: new Date(),
        endDate,
        nextBillingDate: endDate,
      },
    });
  }

  // 4. Seed School Admin User
  const schoolAdminPasswordHash = await bcrypt.hash(
    'Admin@Secure123!',
    12,
  );

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@dpa.edu' },
    update: {},
    create: {
      schoolId: school.id,
      email: 'admin@dpa.edu',
      passwordHash: schoolAdminPasswordHash,
      name: 'Rajesh Malhotra',
      role: UserRole.SCHOOL_ADMIN,
    },
  });

  console.log(`✅ Seeded School Admin: ${schoolAdmin.email}`);

  // 5. Seed Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: '2026-2027',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
    },
  });

  // 6. Seed Classes & Sections
  const class10 = await prisma.class.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Class 10',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Class 10',
      numericOrder: 10,
    },
  });

  const sectionA = await prisma.section.upsert({
    where: {
      classId_name: {
        classId: class10.id,
        name: 'A',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: class10.id,
      name: 'A',
      roomNumber: 'Room 101',
    },
  });

  const sectionB = await prisma.section.upsert({
    where: {
      classId_name: {
        classId: class10.id,
        name: 'B',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: class10.id,
      name: 'B',
      roomNumber: 'Room 102',
    },
  });

  // 7. Seed Subjects
  const mathSubject = await prisma.subject.upsert({
    where: {
      schoolId_code: {
        schoolId: school.id,
        code: 'MATH101',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Mathematics',
      code: 'MATH101',
      type: 'CORE',
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: {
      schoolId_code: {
        schoolId: school.id,
        code: 'SCI101',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Science',
      code: 'SCI101',
      type: 'CORE',
    },
  });

  // 8. Seed Teacher
  const teacherPasswordHash = await bcrypt.hash(
    'Teacher@Secure123!',
    12,
  );

  const teacherUser = await prisma.user.upsert({
    where: { email: 'amit.sharma@dpa.edu' },
    update: {},
    create: {
      schoolId: school.id,
      email: 'amit.sharma@dpa.edu',
      passwordHash: teacherPasswordHash,
      name: 'Amit Sharma',
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: {
      schoolId_employeeId: {
        schoolId: school.id,
        employeeId: 'TCH-001',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      employeeId: 'TCH-001',
      designation: 'Senior Mathematics Teacher',
      qualification: 'M.Sc. Mathematics, B.Ed.',
      gender: Gender.MALE,
      phone: '+91 98111 22334',
    },
  });

  // Assign Teacher to Mathematics for Class 10
  await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: class10.id,
        subjectId: mathSubject.id,
      },
    },
    update: { teacherId: teacher.id },
    create: {
      schoolId: school.id,
      classId: class10.id,
      subjectId: mathSubject.id,
      teacherId: teacher.id,
    },
  });

  // 9. Seed Student
  const studentPasswordHash = await bcrypt.hash(
    'Student@Secure123!',
    12,
  );

  const studentUser = await prisma.user.upsert({
    where: { email: 'rahul.sharma@dpa.edu' },
    update: {},
    create: {
      schoolId: school.id,
      email: 'rahul.sharma@dpa.edu',
      passwordHash: studentPasswordHash,
      name: 'Rahul Sharma',
      role: UserRole.STUDENT,
    },
  });

  const student = await prisma.student.upsert({
    where: {
      schoolId_admissionNo: {
        schoolId: school.id,
        admissionNo: 'ADM-2026-001',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      userId: studentUser.id,
      admissionNo: 'ADM-2026-001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      dateOfBirth: new Date('2010-05-15'),
      gender: Gender.MALE,
      bloodGroup: 'B+',
      emergencyContact: '+91 99999 88888',
      address: 'Flat 402, Sunshine Heights, New Delhi',
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_academicYearId: {
        studentId: student.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      studentId: student.id,
      academicYearId: academicYear.id,
      classId: class10.id,
      sectionId: sectionA.id,
      rollNumber: '1001',
      status: 'ACTIVE',
    },
  });

  console.log(
    `✅ Seeded Demo Student: ${student.firstName} ${student.lastName} in ${class10.name}-${sectionA.name}`,
  );

  // 9.1 Seed Parent User and Profile
  const parentPasswordHash = await bcrypt.hash('Parent@123', 12);

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    update: {
      schoolId: school.id,
      passwordHash: parentPasswordHash,
      name: 'Rahul Sharma Parent',
      role: UserRole.PARENT,
    },
    create: {
      schoolId: school.id,
      email: 'parent@school.com',
      passwordHash: parentPasswordHash,
      name: 'Rahul Sharma Parent',
      role: UserRole.PARENT,
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {
      schoolId: school.id,
      relationship: 'FATHER',
      phone: '+91 99999 88888',
      address: 'Flat 402, Sunshine Heights, New Delhi',
    },
    create: {
      schoolId: school.id,
      userId: parentUser.id,
      relationship: 'FATHER',
      phone: '+91 99999 88888',
      address: 'Flat 402, Sunshine Heights, New Delhi',
    },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { parentId: parent.id },
  });

  console.log(`✅ Seeded Demo Parent: ${parentUser.email}`);

  // 10. Seed Sample Attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.upsert({
    where: {
      sectionId_date: {
        sectionId: sectionA.id,
        date: today,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classId: class10.id,
      sectionId: sectionA.id,
      date: today,
      takenById: teacherUser.id,
      remarks: 'Morning assembly on time',
    },
  });

  await prisma.attendanceRecord.upsert({
    where: {
      attendanceId_studentId: {
        attendanceId: attendance.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      attendanceId: attendance.id,
      studentId: student.id,
      status: AttendanceStatus.PRESENT,
    },
  });

  // 11. Seed Fee Structure, Invoice & Payment
  const existingFeeStructure = await prisma.feeStructure.findFirst({
    where: {
      schoolId: school.id,
      classId: class10.id,
      name: 'Term 1 Tuition & Lab Fee 2026',
    },
  });

  const feeStructure =
    existingFeeStructure ??
    (await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classId: class10.id,
      name: 'Term 1 Tuition & Lab Fee 2026',
      totalAmount: 25000.0,
      frequency: 'QUARTERLY',
      items: {
        create: [
          { name: 'Tuition Fee', amount: 18000.0 },
          { name: 'Computer & Science Lab', amount: 5000.0 },
          { name: 'Sports & Activities', amount: 2000.0 },
        ],
      },
    },
  }));

  const invoice = await prisma.feeInvoice.upsert({
    where: { invoiceNumber: 'INV-2026-00001' },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      studentId: student.id,
      feeStructureId: feeStructure.id,
      invoiceNumber: 'INV-2026-00001',
      totalAmount: 25000.0,
      paidAmount: 15000.0,
      balanceAmount: 10000.0,
      dueDate: new Date('2026-10-15'),
      status: InvoiceStatus.PARTIAL,
    },
  });

  await prisma.feePayment.upsert({
    where: { receiptNumber: 'REC-2026-00001' },
    update: {},
    create: {
      schoolId: school.id,
      feeInvoiceId: invoice.id,
      studentId: student.id,
      receiptNumber: 'REC-2026-00001',
      amount: 15000.0,
      paymentMethod: PaymentMethod.UPI,
      transactionRef: 'UPI/20260928/83728372',
      remarks: 'Part payment received via UPI',
    },
  });

  // 12. Seed Announcement
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: {
      schoolId: school.id,
      title: 'Welcome to Academic Year 2026-2027',
    },
  });

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        authorId: schoolAdmin.id,
        title: 'Welcome to Academic Year 2026-2027',
        content:
          'We welcome all students and staff back to school for an exciting new term!',
        priority: 'HIGH',
        isPublished: true,
      },
    });
  }

  // 13. Seed Core Academic Subjects
  const englishSubject = await prisma.subject.upsert({
    where: {
      schoolId_code: {
        schoolId: school.id,
        code: 'ENG101',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'English Language & Literature',
      code: 'ENG101',
      type: 'CORE',
    },
  });

  const sstSubject = await prisma.subject.upsert({
    where: {
      schoolId_code: {
        schoolId: school.id,
        code: 'SST101',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Social Science',
      code: 'SST101',
      type: 'CORE',
    },
  });

  // 14. Seed Examinations
  const midTermExam = await prisma.exam.upsert({
    where: { id: 'exam-midterm-2026' },
    update: {},
    create: {
      id: 'exam-midterm-2026',
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Mid-Term Examination 2026',
      term: 'Term 1',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-25'),
      status: ExamStatus.ONGOING,
    },
  });

  await prisma.exam.upsert({
    where: { id: 'exam-pa1-2026' },
    update: {},
    create: {
      id: 'exam-pa1-2026',
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Periodic Assessment 1 (PA-1)',
      term: 'Quarter 1',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-18'),
      status: ExamStatus.COMPLETED,
    },
  });

  // Exam Subjects Schedule for Class 10
  const subMath = await prisma.examSubject.upsert({
    where: {
      examId_classId_subjectId: {
        examId: midTermExam.id,
        classId: class10.id,
        subjectId: mathSubject.id,
      },
    },
    update: {},
    create: {
      examId: midTermExam.id,
      classId: class10.id,
      subjectId: mathSubject.id,
      examDate: new Date('2026-10-15T09:00:00Z'),
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      maxMarks: 100.0,
      passMarks: 33.0,
      roomNumber: 'Hall 101',
    },
  });

  const subSci = await prisma.examSubject.upsert({
    where: {
      examId_classId_subjectId: {
        examId: midTermExam.id,
        classId: class10.id,
        subjectId: scienceSubject.id,
      },
    },
    update: {},
    create: {
      examId: midTermExam.id,
      classId: class10.id,
      subjectId: scienceSubject.id,
      examDate: new Date('2026-10-17T09:00:00Z'),
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      maxMarks: 100.0,
      passMarks: 33.0,
      roomNumber: 'Science Lab 2',
    },
  });

  const subEng = await prisma.examSubject.upsert({
    where: {
      examId_classId_subjectId: {
        examId: midTermExam.id,
        classId: class10.id,
        subjectId: englishSubject.id,
      },
    },
    update: {},
    create: {
      examId: midTermExam.id,
      classId: class10.id,
      subjectId: englishSubject.id,
      examDate: new Date('2026-10-20T09:00:00Z'),
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      maxMarks: 100.0,
      passMarks: 33.0,
      roomNumber: 'Hall 102',
    },
  });

  const subSst = await prisma.examSubject.upsert({
    where: {
      examId_classId_subjectId: {
        examId: midTermExam.id,
        classId: class10.id,
        subjectId: sstSubject.id,
      },
    },
    update: {},
    create: {
      examId: midTermExam.id,
      classId: class10.id,
      subjectId: sstSubject.id,
      examDate: new Date('2026-10-22T09:00:00Z'),
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      maxMarks: 100.0,
      passMarks: 33.0,
      roomNumber: 'Room 103',
    },
  });

  // Seed Exam Results for Rahul Sharma
  await prisma.examResult.upsert({
    where: {
      examSubjectId_studentId: {
        examSubjectId: subMath.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      examSubjectId: subMath.id,
      studentId: student.id,
      marksObtained: 88.0,
      grade: 'A2',
      remarks: 'Strong conceptual clarity in Geometry and Algebra.',
    },
  });

  await prisma.examResult.upsert({
    where: {
      examSubjectId_studentId: {
        examSubjectId: subSci.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      examSubjectId: subSci.id,
      studentId: student.id,
      marksObtained: 93.0,
      grade: 'A1',
      remarks:
        'Outstanding experimental application and physics problem solving.',
    },
  });

  await prisma.examResult.upsert({
    where: {
      examSubjectId_studentId: {
        examSubjectId: subEng.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      examSubjectId: subEng.id,
      studentId: student.id,
      marksObtained: 85.0,
      grade: 'A2',
      remarks: 'Expressive prose and excellent comprehension skills.',
    },
  });

  await prisma.examResult.upsert({
    where: {
      examSubjectId_studentId: {
        examSubjectId: subSst.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      examSubjectId: subSst.id,
      studentId: student.id,
      marksObtained: 79.0,
      grade: 'B1',
      remarks: 'Good grasp of Indian History & Contemporary World.',
    },
  });

  // 15. Seed Additional Faculty, Subjects & Weekly Timetable (Class 10-A)
  const seedTeacher = async (
    email: string,
    name: string,
    employeeId: string,
    designation: string,
    qualification: string,
    gender: Gender,
  ) => {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        schoolId: school.id,
        email,
        passwordHash: teacherPasswordHash,
        name,
        role: UserRole.TEACHER,
      },
    });
    return prisma.teacher.upsert({
      where: { schoolId_employeeId: { schoolId: school.id, employeeId } },
      update: {},
      create: {
        schoolId: school.id,
        userId: user.id,
        employeeId,
        designation,
        qualification,
        gender,
      },
    });
  };

  const scienceTeacher = await seedTeacher(
    'priya.patel@dpa.edu',
    'Priya Patel',
    'TCH-002',
    'PGT Science',
    'M.Sc. Physics, B.Ed.',
    Gender.FEMALE,
  );
  const englishTeacher = await seedTeacher(
    'sunita.rao@dpa.edu',
    'Sunita Rao',
    'TCH-003',
    'TGT English & Hindi',
    'M.A. English, B.Ed.',
    Gender.FEMALE,
  );

  const seedSubject = (code: string, name: string) =>
    prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code } },
      update: {},
      create: { schoolId: school.id, name, code, type: 'CORE' },
    });

  const hindiSubject = await seedSubject('HIN101', 'Hindi');
  const computerSubject = await seedSubject('CS101', 'Computer Science');

  // Subject → teacher → room mapping for Class 10
  const periodPlan = [
    { subject: mathSubject, teacher: teacher, room: sectionA.roomNumber ?? 'Room 101' },
    { subject: scienceSubject, teacher: scienceTeacher, room: 'Science Lab 1' },
    { subject: englishSubject, teacher: englishTeacher, room: sectionA.roomNumber ?? 'Room 101' },
    { subject: sstSubject, teacher: englishTeacher, room: sectionA.roomNumber ?? 'Room 101' },
    { subject: hindiSubject, teacher: englishTeacher, room: sectionA.roomNumber ?? 'Room 101' },
    { subject: computerSubject, teacher: scienceTeacher, room: 'Computer Lab' },
  ];

  for (const plan of periodPlan) {
    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: class10.id, subjectId: plan.subject.id } },
      update: {},
      create: {
        schoolId: school.id,
        classId: class10.id,
        subjectId: plan.subject.id,
        teacherId: plan.teacher.id,
      },
    });
  }

  const existingTimetableRows = await prisma.timetable.count({
    where: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classId: class10.id,
      sectionId: sectionA.id,
    },
  });

  if (existingTimetableRows === 0) {
    const periodTimes = [
      ['08:30', '09:15'],
      ['09:15', '10:00'],
      ['10:15', '11:00'],
      ['11:00', '11:45'],
      ['12:30', '13:15'],
      ['13:15', '14:00'],
    ] as const;
    const weekDays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    // Rotate the subject order each day so every subject lands in different slots
    await prisma.timetable.createMany({
      data: weekDays.flatMap((dayOfWeek, dayIdx) =>
        periodTimes.map(([startTime, endTime], periodIdx) => {
          const plan = periodPlan[(periodIdx + dayIdx) % periodPlan.length];
          return {
            schoolId: school.id,
            academicYearId: academicYear.id,
            classId: class10.id,
            sectionId: sectionA.id,
            subjectId: plan.subject.id,
            teacherId: plan.teacher.id,
            dayOfWeek,
            periodNumber: periodIdx + 1,
            startTime,
            endTime,
            roomNumber: plan.room,
          };
        }),
      ),
    });
    console.log('✅ Seeded weekly timetable for Class 10-A (Mon–Sat, 6 periods)');
  } else {
    console.log('ℹ️  Timetable for Class 10-A already exists, skipping');
  }

  // 16. Seed Homework Assignments for Class 10-A (dates relative to seeding day)
  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  };

  const assignmentPlan = [
    {
      title: 'Quadratic Equations – Exercise 4.3',
      description: 'Solve questions 1–8 of NCERT Exercise 4.3 using the quadratic formula. Show the discriminant for each.',
      subject: mathSubject,
      teacher: teacher,
      dueInDays: 5,
      maxMarks: 20,
      submission: null,
    },
    {
      title: "Ohm's Law Lab Report",
      description: 'Write up the V–I readings from Tuesday\'s lab, plot the graph and state your conclusion about resistance.',
      subject: scienceSubject,
      teacher: scienceTeacher,
      dueInDays: 2,
      maxMarks: 25,
      submission: null,
    },
    {
      title: 'Python Loops Worksheet',
      description: 'Complete the 10 for/while loop exercises from the worksheet and paste your code with outputs.',
      subject: computerSubject,
      teacher: scienceTeacher,
      dueInDays: 9,
      maxMarks: 20,
      submission: null,
    },
    {
      title: 'Letter to the Editor',
      description: 'Write a formal letter (150–200 words) to the editor of a newspaper about plastic waste in your locality.',
      subject: englishSubject,
      teacher: englishTeacher,
      dueInDays: -7,
      maxMarks: 20,
      submission: {
        content: 'Submitted my letter on plastic waste near Sunshine Heights market.',
        marksObtained: 18,
        feedback: 'Excellent format and a persuasive tone. Watch your paragraph transitions.',
        status: 'GRADED',
      },
    },
    {
      title: 'Map Work: Resources & Development',
      description: 'Mark the major soil types and two multipurpose river projects on the outline map of India.',
      subject: sstSubject,
      teacher: englishTeacher,
      dueInDays: -3,
      maxMarks: 10,
      submission: {
        content: 'Map completed — soil regions shaded and Bhakra Nangal and Hirakud marked.',
        marksObtained: null,
        feedback: null,
        status: 'SUBMITTED',
      },
    },
  ];

  let seededAssignments = 0;
  for (const plan of assignmentPlan) {
    const existing = await prisma.assignment.findFirst({
      where: { schoolId: school.id, sectionId: sectionA.id, title: plan.title },
      select: { id: true },
    });
    if (existing) continue;

    const created = await prisma.assignment.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        classId: class10.id,
        sectionId: sectionA.id,
        subjectId: plan.subject.id,
        teacherId: plan.teacher.id,
        title: plan.title,
        description: plan.description,
        dueDate: daysFromNow(plan.dueInDays),
        maxMarks: plan.maxMarks,
        status: 'PUBLISHED',
      },
    });
    seededAssignments += 1;

    if (plan.submission) {
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: created.id,
          studentId: student.id,
          content: plan.submission.content,
          submittedAt: daysFromNow(plan.dueInDays - 1),
          status: plan.submission.status,
          marksObtained: plan.submission.marksObtained,
          feedback: plan.submission.feedback,
          gradedAt: plan.submission.status === 'GRADED' ? daysFromNow(plan.dueInDays + 2) : null,
        },
      });
    }
  }
  console.log(
    seededAssignments
      ? `✅ Seeded ${seededAssignments} homework assignments for Class 10-A`
      : 'ℹ️  Homework assignments for Class 10-A already exist, skipping',
  );

  console.log('\n🎉 Database Seeding Completed Successfully!\n');
  console.log('====================================================');
  console.log('🔑 TEST LOGIN CREDENTIALS:');
  console.log(
    '👑 Super Admin: superadmin@platform.com | SuperAdmin@Secure123!',
  );
  console.log('🏫 School Admin: admin@dpa.edu | Admin@Secure123!');
  console.log('👨‍🏫 Teacher: amit.sharma@dpa.edu | Teacher@Secure123!');
  console.log(
    '🎓 Student: rahul.sharma@dpa.edu | Student@Secure123!',
  );
  console.log('👨‍👩‍👦 Parent: parent@school.com | Parent@123');
  console.log('More teachers: priya.patel@dpa.edu, sunita.rao@dpa.edu | Teacher@Secure123!');
  console.log('====================================================\n');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
