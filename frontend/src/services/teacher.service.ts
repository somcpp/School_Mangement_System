/**
 * @file teacher.service.ts
 * @description API service for Teachers and Faculty.
 */

import { api } from '../lib/api';
import type { Teacher, CreateTeacherInput } from '../types';

export const teacherService = {
  /** List teachers with assigned subjects */
  getTeachers: async (): Promise<Teacher[]> => {
    const res = await api.get('/teachers');
    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    return raw.map((t: any) => ({
      id: t.id,
      employeeId: t.employeeId,
      name: t.name || t.user?.name || 'Faculty Member',
      designation: t.designation || 'Teacher',
      department: t.department || '',
      email: t.user?.email || t.email || '',
      phone: t.phone || t.user?.phone || '',
      qualification: t.qualification || '',
      experience: '',
      subjects: t.assignedSubjects?.map((as: any) => `${as.class} ${as.subject}`) ||
        (Array.isArray(t.subjects) ? t.subjects : [t.designation || 'General Studies']),
      avatarUrl: t.avatarUrl || t.user?.avatarUrl || '',
      status: (t.status === 'ON_LEAVE' ? 'ON_LEAVE' : 'ACTIVE') as 'ACTIVE' | 'ON_LEAVE',
      joiningDate: (t.joiningDate || t.createdAt)
        ? new Date(t.joiningDate || t.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : '',
    }));
  },

  /** Create teacher profile + user login */
  createTeacher: async (data: CreateTeacherInput): Promise<any> => {
    const res = await api.post('/teachers', data);
    return res.data.data;
  },
};
