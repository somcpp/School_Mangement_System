/**
 * @file reports.routes.ts
 * @description Express routes for reports.
 */

import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { UserRole } from '@prisma/client';
import { validate } from '../../middleware/validate.middleware.js';
import { attendanceReportQuerySchema, feeReportQuerySchema } from './reports.schema.js';

const router = Router();

router.use(authenticate, requireTenant, requireRoles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN));

router.get('/attendance', validate(attendanceReportQuerySchema), ReportsController.getAttendanceReport);
router.get('/fees', validate(feeReportQuerySchema), ReportsController.getFeeReport);

export const reportRoutes = router;
