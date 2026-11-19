/**
 * @file useParent.ts
 * @description TanStack Query hooks for the parent portal. The children list is shared (one
 * request, cached) across the parent dashboard, attendance, fee ledger and timetable views.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentService } from '../services';

export const PARENT_KEYS = {
  all: ['parent'] as const,
  children: () => [...PARENT_KEYS.all, 'children'] as const,
  dashboard: (studentId: string) => [...PARENT_KEYS.all, 'dashboard', studentId] as const,
  attendance: (studentId: string) => [...PARENT_KEYS.all, 'attendance', studentId] as const,
  fees: (studentId: string) => [...PARENT_KEYS.all, 'fees', studentId] as const,
};

export const useParentChildren = (enabled = true) =>
  useQuery({
    queryKey: PARENT_KEYS.children(),
    queryFn: parentService.getChildren,
    enabled,
    staleTime: 1000 * 60 * 10,
  });

/**
 * Children list + the currently selected child. Falls back to the first child when nothing
 * (or a child that is no longer linked) is selected.
 */
export const useSelectedChild = () => {
  const childrenQuery = useParentChildren();
  const [picked, setSelectedChildId] = useState('');
  const children = childrenQuery.data ?? [];
  const selectedChildId = children.some((c) => c.id === picked) ? picked : (children[0]?.id ?? '');
  return { childrenQuery, children, selectedChildId, setSelectedChildId };
};

export const useParentDashboard = <T>(studentId: string) =>
  useQuery({
    queryKey: PARENT_KEYS.dashboard(studentId),
    queryFn: () => parentService.getDashboard<T>(studentId),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });

export const useChildAttendance = <T>(studentId: string) =>
  useQuery({
    queryKey: PARENT_KEYS.attendance(studentId),
    queryFn: () => parentService.getChildAttendance<T>(studentId),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });

export const useChildFees = <T>(studentId: string) =>
  useQuery({
    queryKey: PARENT_KEYS.fees(studentId),
    queryFn: () => parentService.getChildFees<T>(studentId),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });
