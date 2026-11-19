/**
 * @file report.service.ts
 * @description Frontend API service for institutional attendance and fee reports.
 * `schoolId` is only needed (and only honoured) for a Super Admin viewing a specific tenant.
 */

import { api } from '../lib/api';

export interface AttendanceReportStudent {
  id: string;
  admissionNo: string;
  name: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

/** GET /reports/attendance */
export interface AttendanceReportData {
  dateRange: { startDate: string; endDate: string };
  classId: string;
  overallAttendanceRate: number;
  studentsCount: number;
  students: AttendanceReportStudent[];
}

export interface FeeStructureSummary {
  id: string;
  name: string;
  class: string;
  invoicesCount: number;
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  collectionPercentage: number;
}

/** GET /reports/fees */
export interface FeeReportData {
  feeStructures: FeeStructureSummary[];
}

export interface AttendanceReportParams {
  classId: string;
  sectionId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  schoolId?: string;
}

const withoutEmpty = (params: Record<string, string | undefined>) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v));

export const reportService = {
  async getAttendanceReport(params: AttendanceReportParams): Promise<AttendanceReportData> {
    const response = await api.get<{ data: AttendanceReportData }>('/reports/attendance', {
      params: withoutEmpty({ ...params }),
    });
    return response.data.data;
  },

  async getFeeReport(params: { academicYearId?: string; schoolId?: string } = {}): Promise<FeeReportData> {
    const response = await api.get<{ data: FeeReportData }>('/reports/fees', { params: withoutEmpty(params) });
    return response.data.data ?? { feeStructures: [] };
  },
};
