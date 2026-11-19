/**
 * @file useAssignments.ts
 * @description TanStack Query hooks for homework assignments (staff side).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../services';
import type { CreateAssignmentPayload } from '../types';
import { STUDENT_SUBJECT_KEYS } from './useStudentSubjects';

export const ASSIGNMENT_KEYS = {
  all: ['assignments'] as const,
  list: (filters?: { classId?: string; sectionId?: string; subjectId?: string }) =>
    [...ASSIGNMENT_KEYS.all, 'list', filters ?? {}] as const,
};

export const useAssignments = (filters?: { classId?: string; sectionId?: string; subjectId?: string }) =>
  useQuery({
    queryKey: ASSIGNMENT_KEYS.list(filters),
    queryFn: () => assignmentService.getAssignments(filters),
    staleTime: 1000 * 60 * 2,
  });

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateAssignmentPayload, 'academicYearId'> & { academicYearId?: string }) =>
      assignmentService.createAssignment(payload as CreateAssignmentPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: STUDENT_SUBJECT_KEYS.assignments() });
    },
  });
};
