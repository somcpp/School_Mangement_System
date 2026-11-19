/**
 * @file usePlatform.ts
 * @description TanStack Query hooks for the Super Admin platform console: school tenants and
 * SaaS subscription plans.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schoolService, subscriptionService } from '../services';
import type { CreateSchoolDto, UpdateSchoolDto } from '../services';

export const PLATFORM_KEYS = {
  all: ['platform'] as const,
  schools: () => [...PLATFORM_KEYS.all, 'schools'] as const,
  plans: () => [...PLATFORM_KEYS.all, 'plans'] as const,
};

export const useSchools = (enabled = true) =>
  useQuery({
    queryKey: PLATFORM_KEYS.schools(),
    queryFn: () => schoolService.listSchools(),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: PLATFORM_KEYS.plans(),
    queryFn: subscriptionService.getPlans,
    staleTime: 1000 * 60 * 30,
  });

export const useCreateSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSchoolDto) => schoolService.createSchool(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_KEYS.schools() }),
  });
};

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSchoolDto }) => schoolService.updateSchool(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_KEYS.schools() }),
  });
};
