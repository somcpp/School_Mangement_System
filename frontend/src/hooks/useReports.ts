/**
 * @file useReports.ts
 * @description TanStack Query hooks for institutional reports (fees, attendance) and the
 * class list a report is filtered by. A Super Admin passes the target `schoolId`.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { reportService, type AttendanceReportParams } from '../services';
import type { ClassItem } from '../types';

export const REPORT_KEYS = {
  all: ['reports'] as const,
  fees: (schoolId?: string) => [...REPORT_KEYS.all, 'fees', schoolId ?? 'own'] as const,
  attendance: (params: AttendanceReportParams) => [...REPORT_KEYS.all, 'attendance', params] as const,
  classes: (schoolId?: string) => [...REPORT_KEYS.all, 'classes', schoolId ?? 'own'] as const,
};

export const useFeeReport = (schoolId?: string, enabled = true) =>
  useQuery({
    queryKey: REPORT_KEYS.fees(schoolId),
    queryFn: () => reportService.getFeeReport({ schoolId }),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

export const useAttendanceReport = (params: AttendanceReportParams, enabled = true) =>
  useQuery({
    queryKey: REPORT_KEYS.attendance(params),
    queryFn: () => reportService.getAttendanceReport(params),
    enabled: enabled && Boolean(params.classId && params.startDate && params.endDate),
    staleTime: 1000 * 60 * 2,
  });

/** Classes of the school a report targets (the tenant's own, or a Super Admin's selection). */
export const useReportClasses = (schoolId?: string, enabled = true) =>
  useQuery({
    queryKey: REPORT_KEYS.classes(schoolId),
    queryFn: async (): Promise<ClassItem[]> => {
      const res = await api.get('/academics/classes', { params: schoolId ? { schoolId } : {} });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
