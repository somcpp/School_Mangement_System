/**
 * @file parent.service.ts
 * @description API service for the parent portal (linked children, dashboard, attendance, fees).
 * Every endpoint is scoped server-side to the signed-in parent's own children.
 */

import { api } from '../lib/api';

export interface ParentChild {
  id: string;
  admissionNo?: string;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string;
  status?: string;
}

const unwrap = <T>(payload: any): T => (payload?.data ?? payload) as T;

export const parentService = {
  getChildren: async (): Promise<ParentChild[]> => {
    const res = await api.get('/parent/children');
    const list = unwrap<ParentChild[]>(res.data);
    return Array.isArray(list) ? list : [];
  },

  /** Typed by the consuming view (shapes are view-specific). */
  getDashboard: async <T>(studentId: string): Promise<T> => {
    const res = await api.get(`/parent/dashboard?studentId=${encodeURIComponent(studentId)}`);
    return unwrap<T>(res.data);
  },

  getChildAttendance: async <T>(studentId: string): Promise<T> => {
    const res = await api.get(`/parent/children/${encodeURIComponent(studentId)}/attendance`);
    return unwrap<T>(res.data);
  },

  getChildFees: async <T>(studentId: string): Promise<T> => {
    const res = await api.get(`/parent/children/${encodeURIComponent(studentId)}/fees`);
    return unwrap<T>(res.data);
  },
};
