/**
 * @file ReportsPage.tsx
 * @description Institutional reports on real data: fee collection (GET /reports/fees) and
 * attendance analytics (GET /reports/attendance). School admins see their own school; a Super
 * Admin picks the tenant to report on.
 */

import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSchools } from '../hooks';
import { AttendanceReportSection, FeeReportSection, getChartTheme } from '../components/features/reports';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const theme = getChartTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canView = isSuperAdmin || user?.role === 'SCHOOL_ADMIN';

  // Tenant list is platform-only (403 for school admins)
  const schoolsQuery = useSchools(isSuperAdmin);
  const schools = isSuperAdmin ? (schoolsQuery.data?.schools ?? []) : [];
  const [pickedSchoolId, setPickedSchoolId] = useState('');
  const schoolId = isSuperAdmin ? pickedSchoolId || schools[0]?.id || '' : undefined;
  const ready = canView && (!isSuperAdmin || Boolean(schoolId));

  if (!canView) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-surface rounded-3xl p-10 border border-border shadow-card text-center">
        <h1 className="text-lg font-bold text-primary">Reports are available to school administrators</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Analytics &amp; Institutional Reports</h1>
          <p className="text-sm text-secondary">Fee collection and attendance compliance from live school records, exportable as CSV.</p>
        </div>
        {isSuperAdmin && (
          <label className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-3 py-2 shadow-sm">
            <Building2 className="w-4 h-4 text-muted" />
            <span className="text-xs font-bold text-muted">School:</span>
            <select
              value={schoolId}
              onChange={(e) => setPickedSchoolId(e.target.value)}
              disabled={!schools.length}
              className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              {schoolsQuery.isLoading && <option>Loading…</option>}
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isSuperAdmin && !schoolsQuery.isLoading && schools.length === 0 ? (
        <div className="bg-surface rounded-3xl p-10 border border-border shadow-card text-center text-sm text-secondary">
          {schoolsQuery.isError ? 'Could not load school tenants.' : 'No school tenants yet.'}
        </div>
      ) : (
        <>
          <FeeReportSection schoolId={schoolId} enabled={ready} theme={theme} />
          <AttendanceReportSection schoolId={schoolId} enabled={ready} theme={theme} />
        </>
      )}
    </div>
  );
};
