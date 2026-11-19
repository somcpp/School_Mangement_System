/**
 * @file useStudentSubjects.ts
 * @description TanStack Query hooks for the student "My Subjects" portal: own subjects,
 * own section's homework (with own submission) and homework submission.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicService, assignmentService } from '../services';
import type { SubmitAssignmentPayload } from '../types';

export const STUDENT_SUBJECT_KEYS = {
  all: ['student-subjects'] as const,
  subjects: () => [...STUDENT_SUBJECT_KEYS.all, 'subjects'] as const,
  assignments: () => [...STUDENT_SUBJECT_KEYS.all, 'assignments'] as const,
};

export const useMySubjects = () =>
  useQuery({
    queryKey: STUDENT_SUBJECT_KEYS.subjects(),
    queryFn: academicService.getMySubjects,
    staleTime: 1000 * 60 * 10,
  });

/** The API scopes students to their own section and includes only their own submission. */
export const useMyAssignments = () =>
  useQuery({
    queryKey: STUDENT_SUBJECT_KEYS.assignments(),
    queryFn: () => assignmentService.getAssignments(),
    staleTime: 1000 * 60 * 2,
  });

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: SubmitAssignmentPayload }) =>
      assignmentService.submitAssignment(assignmentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDENT_SUBJECT_KEYS.assignments() }),
  });
};
