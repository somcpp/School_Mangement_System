/**
 * @file exam.service.ts
 * @description Frontend API service for Examinations, Date Sheets, Marks Entry, and CBSE Report Cards.
 */

import { api } from '../lib/api';

export interface ExamSubject {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passMarks: number;
  roomNumber?: string;
  class?: { name: string };
  subject?: { name: string; code: string };
  _count?: { results: number };
}

export interface ExamItem {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  term?: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  academicYear?: { name: string };
  subjects?: ExamSubject[];
  _count?: { subjects: number };
}

export interface CreateExamDto {
  academicYearId: string;
  name: string;
  term?: string;
  startDate: string;
  endDate: string;
}

export interface AddExamSubjectDto {
  classId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks?: number;
  passMarks?: number;
  roomNumber?: string;
}

export interface SubmitMarksDto {
  examSubjectId: string;
  marks: Array<{
    studentId: string;
    marksObtained: number;
    remarks?: string;
  }>;
}

export interface ReportCardResponse {
  school: {
    name: string;
    code: string;
    affiliationNo?: string;
    board: string;
    address?: string;
  };
  student: {
    id: string;
    admissionNo: string;
    name: string;
    className: string;
    sectionName: string;
    rollNumber?: number;
    avatarUrl?: string;
  };
  exam: {
    id: string;
    name: string;
    academicYear: string;
  };
  results: Array<{
    subjectName: string;
    subjectCode: string;
    maxMarks: number;
    passMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
    status: 'PASSED' | 'FAILED';
    remarks?: string;
  }>;
  summary: {
    totalMaxMarks: number;
    totalMarksObtained: number;
    overallPercentage: number;
    overallGrade: string;
    status: 'PASSED' | 'FAILED';
  };
}

/**
 * The API returns { exam, student: { fullName, class, section }, subjects[], summary: { percentage,
 * resultStatus } } — map it onto the shape the report card UI renders. Already-normalised input
 * (with `results`) is passed through.
 */
export const normalizeReportCard = (raw: any): ReportCardResponse => {
  if (!raw || Array.isArray(raw.results)) return raw;
  const subjects: any[] = Array.isArray(raw.subjects) ? raw.subjects : [];
  return {
    school: {
      name: raw.school?.name ?? '',
      code: raw.school?.code ?? '',
      affiliationNo: raw.school?.affiliationNo,
      board: raw.school?.board ?? 'CBSE',
      address: raw.school?.address,
    },
    student: {
      id: raw.student?.id ?? '',
      admissionNo: raw.student?.admissionNo ?? '',
      name: raw.student?.fullName ?? raw.student?.name ?? '',
      className: raw.student?.class ?? raw.student?.className ?? '',
      sectionName: raw.student?.section ?? raw.student?.sectionName ?? '',
      rollNumber: raw.student?.rollNumber,
    },
    exam: {
      id: raw.exam?.id ?? '',
      name: raw.exam?.name ?? '',
      academicYear: raw.exam?.academicYear ?? '',
    },
    results: subjects.map((r) => {
      const max = Number(r.maxMarks) || 0;
      const obtained = Number(r.marksObtained) || 0;
      return {
        subjectName: r.subjectName,
        subjectCode: r.subjectCode,
        maxMarks: max,
        passMarks: Number(r.passMarks) || 0,
        marksObtained: obtained,
        percentage: max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0,
        grade: r.grade ?? '',
        status: r.isPassed === false ? 'FAILED' : 'PASSED',
        remarks: r.remarks ?? undefined,
      };
    }),
    summary: {
      totalMaxMarks: Number(raw.summary?.totalMaxMarks) || 0,
      totalMarksObtained: Number(raw.summary?.totalMarksObtained) || 0,
      overallPercentage: Number(raw.summary?.percentage ?? raw.summary?.overallPercentage) || 0,
      overallGrade: raw.summary?.overallGrade ?? '',
      status: raw.summary?.resultStatus === 'FAIL' ? 'FAILED' : 'PASSED',
    },
  };
};

export const examService = {
  /**
   * Fetch all exams for current school
   */
  async listExams(academicYearId?: string): Promise<ExamItem[]> {
    const params = academicYearId ? { academicYearId } : {};
    const response = await api.get<{ data: ExamItem[] }>('/exams', { params });
    return response.data.data;
  },

  /**
   * Fetch complete exam details with scheduled subjects and result counts
   */
  async getExamDetails(id: string): Promise<ExamItem> {
    const response = await api.get<{ data: ExamItem }>(`/exams/${id}`);
    return response.data.data;
  },

  /**
   * Create a new Exam term
   */
  async createExam(data: CreateExamDto): Promise<ExamItem> {
    const response = await api.post<{ data: ExamItem }>('/exams', data);
    return response.data.data;
  },

  /**
   * Add a scheduled subject / datesheet slot to an Exam
   */
  async addExamSubject(examId: string, data: AddExamSubjectDto): Promise<ExamSubject> {
    const response = await api.post<{ data: ExamSubject }>(`/exams/${examId}/subjects`, data);
    return response.data.data;
  },

  /**
   * Submit marks for students in an exam subject
   */
  async submitMarks(data: SubmitMarksDto): Promise<{ success: boolean; count: number }> {
    const response = await api.post<{ data: { success: boolean; count: number } }>('/exams/marks', data);
    return response.data.data;
  },

  /**
   * Fetch official CBSE-format Student Report Card
   */
  async getStudentReportCard(examId: string, studentId: string): Promise<ReportCardResponse> {
    const response = await api.get<{ data: any }>(`/exams/${examId}/report-card/${studentId}`);
    return normalizeReportCard(response.data.data);
  },
};
