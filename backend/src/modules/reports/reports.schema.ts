/**
 * @file reports.schema.ts
 * @description Zod validation for institutional report queries.
 */

import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const attendanceReportQuerySchema = z.object({
  query: z
    .object({
      classId: z.string().uuid('classId is required'),
      sectionId: z.string().uuid().optional(),
      startDate: isoDate,
      endDate: isoDate,
      schoolId: z.string().uuid().optional(), // super admin tenant selection
    })
    .refine((q) => q.startDate <= q.endDate, { message: 'startDate must be on or before endDate', path: ['startDate'] }),
});

export const feeReportQuerySchema = z.object({
  query: z.object({
    academicYearId: z.string().uuid().optional(),
    schoolId: z.string().uuid().optional(),
  }),
});
