/**
 * @file student.service.ts
 * @description API service for Students and Admissions.
 */

import { api } from '../lib/api';
import type { Student, AdmitStudentInput } from '../types';

export const studentService = {
  /** List students with optional search and filters */
  getStudents: async (params?: { search?: string; classId?: string; sectionId?: string; limit?: number }): Promise<Student[]> => {
    const res = await api.get('/students', { params: { limit: 100, ...params } });
    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    // Map only fields the list API actually returns — never invent values
    return raw.map((s: any) => {
      const sectionName = s.section && s.section !== 'Unassigned' ? s.section : null;
      return {
        id: s.id,
        admissionNo: s.admissionNo,
        rollNo: s.rollNumber ? String(s.rollNumber) : '',
        firstName: s.firstName,
        lastName: s.lastName,
        name: s.fullName || [s.firstName, s.lastName].filter(Boolean).join(' '),
        email: s.email,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        bloodGroup: s.bloodGroup || undefined,
        status: s.status,
        class: s.class || 'Unassigned',
        section: sectionName ? `Section ${sectionName}` : '—',
        attendancePercentage: typeof s.attendancePercentage === 'number' ? s.attendancePercentage : undefined,
        feeBalance: Number(s.feeBalance ?? 0),
        avatarUrl: s.avatarUrl || undefined,
        parentName: s.parentName || undefined,
        parentPhone: s.parentPhone || undefined,
      };
    });
  },

  /** Get student profile details by ID */
  getStudentById: async (studentId: string): Promise<Student> => {
    const res = await api.get(`/students/${studentId}`);
    return res.data.data;
  },

  /** Admit a new student */
  admitStudent: async (data: AdmitStudentInput): Promise<any> => {
    const res = await api.post('/students', data);
    return res.data.data;
  },
};
