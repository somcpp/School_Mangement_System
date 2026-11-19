/**
 * @file StudentsPage.tsx
 * @description Comprehensive Student Admissions & Directory Orchestrator.
 * Powered by TanStack Query (caching & optimistic mutations) and layered component architecture.
 */

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useStudents, useClasses } from '../hooks';
import {
  StudentFilters,
  StudentTable,
  StudentAdmissionModal,
  StudentProfileDrawer,
} from '../components/features/students';
import type { Student } from '../types';


export const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  // TanStack Query Hooks
  const studentsQuery = useStudents();
  const { isLoading } = studentsQuery;
  const { data: classesList = [] } = useClasses();
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  // Filter students by search term and selected class
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`;
      const admissionNo = s.admissionNo || '';
      const rollNo = s.rollNo || '';
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rollNo.includes(searchTerm);
      const matchesClass = selectedClass === 'ALL' || s.class.includes(selectedClass);
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span>Student Admissions &amp; Directory</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-blue-subtle text-accent-blue">
              {students.length} Enrolled
            </span>
          </h1>
          <p className="text-xs text-secondary mt-1">
            Manage student registrations, academic records, and parent contacts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdmissionModal(true)}
          className="px-5 py-2.5 rounded-full bg-accent-blue text-white font-semibold text-xs shadow-card hover:bg-brand-sky-dark transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Admit New Student</span>
        </button>
      </div>

      {/* Filter Bar */}
      <StudentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        classes={classesList}
      />

      {studentsQuery.isError && (
        <div className="p-4 rounded-2xl bg-accent-rose-subtle border border-border text-accent-rose text-xs font-bold flex items-center justify-between gap-3">
          <span>Could not load the student directory.</span>
          <button
            type="button"
            onClick={() => studentsQuery.refetch()}
            className="px-3 py-1.5 rounded-xl bg-surface border border-border text-primary hover:bg-surface-raised transition-all cursor-pointer active:scale-95"
          >
            Retry
          </button>
        </div>
      )}

      {/* Roster Table */}
      <StudentTable
        students={filteredStudents}
        onSelectStudent={setSelectedStudent}
        isLoading={isLoading}
      />

      {/* Admission Modal */}
      <StudentAdmissionModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
        nextRollNumber={students.length + 1}
      />

      {/* Student Profile Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default StudentsPage;
