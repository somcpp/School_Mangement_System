/**
 * @file useTimetable.ts
 * @description TanStack Query hooks for weekly class / teacher timetables.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableService } from '../services';
import type { CreateTimetableEntryDto, TimetableFilters } from '../services';
import { useParentChildren, useParentDashboard } from './useParent';

export const TIMETABLE_KEYS = {
  all: ['timetable'] as const,
  list: (filters: TimetableFilters) => [...TIMETABLE_KEYS.all, 'list', filters] as const,
};

/**
 * Weekly timetable for a section or teacher. Disabled until a filter is known so
 * we never fetch the whole school's schedule by accident.
 */
export const useTimetable = (filters: TimetableFilters, enabled = true) => {
  const hasFilter = Boolean(filters.sectionId || filters.teacherId);
  return useQuery({
    queryKey: TIMETABLE_KEYS.list(filters),
    queryFn: () => timetableService.getTimetable(filters),
    enabled: enabled && hasFilter,
    staleTime: 1000 * 60 * 5,
  });
};

export interface ClassScope {
  classId: string;
  sectionId: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string | null;
  studentName?: string;
}

/**
 * For parents: resolve the first child's active class/section from the (shared, cached)
 * parent children + dashboard queries.
 */
export const useParentClassScope = (enabled: boolean) => {
  const childrenQuery = useParentChildren(enabled);
  const child = childrenQuery.data?.[0];
  const dashboardQuery = useParentDashboard<{
    enrollment?: {
      classId: string;
      sectionId: string;
      rollNumber?: string | null;
      class?: { name: string };
      section?: { name: string };
    } | null;
  }>(enabled && child ? child.id : '');

  const enrollment = dashboardQuery.data?.enrollment;
  const data: ClassScope | null =
    child && enrollment
      ? {
          classId: enrollment.classId,
          sectionId: enrollment.sectionId,
          className: enrollment.class?.name,
          sectionName: enrollment.section?.name,
          rollNumber: enrollment.rollNumber,
          studentName: [child.firstName, child.lastName].filter(Boolean).join(' '),
        }
      : null;

  return {
    data,
    isLoading: childrenQuery.isLoading || dashboardQuery.isLoading,
    error: childrenQuery.error || dashboardQuery.error,
    refetch: () => {
      void childrenQuery.refetch();
      if (child) void dashboardQuery.refetch();
    },
  };
};

export const useCreateTimetableEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimetableEntryDto) => timetableService.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIMETABLE_KEYS.all });
    },
  });
};
