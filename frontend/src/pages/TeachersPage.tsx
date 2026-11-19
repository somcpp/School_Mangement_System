/**
 * @file TeachersPage.tsx
 * @description Faculty & Teaching Staff Directory Orchestrator.
 * Powered by TanStack Query, typed services, and modular feature components.
 */

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTeachers } from '../hooks';
import {
  TeacherFilters,
  TeacherGrid,
  AddTeacherModal,
  TeacherProfileDrawer,
} from '../components/features/teachers';
import type { Teacher } from '../types';


export const TeachersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // TanStack Query Hook
  const teachersQuery = useTeachers();
  const { isLoading } = teachersQuery;
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchQuery =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      // No department field in the data model: match the filter against assigned subjects
      const matchDept =
        selectedDept === 'ALL' ||
        t.department === selectedDept ||
        t.subjects.some((s) => s.toLowerCase().includes(selectedDept.toLowerCase()));
      return matchQuery && matchDept;
    });
  }, [teachers, search, selectedDept]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span>Faculty &amp; Teaching Staff</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-blue-subtle text-accent-blue">
              {teachers.length} Active Staff
            </span>
          </h1>
          <p className="text-sm text-secondary">
            Manage teaching staff profiles, subject allocations, and credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue text-white font-semibold text-sm shadow-card hover:bg-brand-sky-dark transition-all self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Filters & Search */}
      <TeacherFilters
        search={search}
        onSearchChange={setSearch}
        selectedDept={selectedDept}
        onDeptChange={setSelectedDept}
      />

      {teachersQuery.isError && (
        <div className="p-4 rounded-2xl bg-accent-rose-subtle border border-border text-accent-rose text-xs font-bold flex items-center justify-between gap-3">
          <span>Could not load the faculty directory.</span>
          <button
            type="button"
            onClick={() => teachersQuery.refetch()}
            className="px-3 py-1.5 rounded-xl bg-surface border border-border text-primary hover:bg-surface-raised transition-all cursor-pointer active:scale-95"
          >
            Retry
          </button>
        </div>
      )}

      {/* Teachers Grid */}
      <TeacherGrid
        teachers={filteredTeachers}
        onSelectTeacher={setSelectedTeacher}
        isLoading={isLoading}
      />

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        nextEmployeeId={`TCH-${String(teachers.length + 1).padStart(3, '0')}`}
      />

      {/* Teacher Profile Drawer */}
      <TeacherProfileDrawer
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
      />
    </div>
  );
};

export default TeachersPage;
