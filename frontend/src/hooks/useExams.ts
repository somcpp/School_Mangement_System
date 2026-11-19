/**
 * @file useExams.ts
 * @description TanStack Query hooks for examinations, date sheets and report cards.
 */

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { examService } from '../services';
import type { AddExamSubjectDto, CreateExamDto, SubmitMarksDto } from '../services';

export const EXAM_KEYS = {
  all: ['exams'] as const,
  list: () => [...EXAM_KEYS.all, 'list'] as const,
  detail: (id: string) => [...EXAM_KEYS.all, 'detail', id] as const,
  reportCard: (examId: string, studentId: string) => [...EXAM_KEYS.all, 'report-card', examId, studentId] as const,
};

export const useExams = () =>
  useQuery({
    queryKey: EXAM_KEYS.list(),
    queryFn: () => examService.listExams(),
    staleTime: 1000 * 60 * 5,
  });

export const useExamDetails = (examId?: string) =>
  useQuery({
    queryKey: EXAM_KEYS.detail(examId ?? ''),
    queryFn: () => examService.getExamDetails(examId!),
    enabled: Boolean(examId),
    staleTime: 1000 * 60 * 5,
  });

/** Date sheets for several exams at once (one request per exam, cached individually). */
export const useExamDetailsMany = (examIds: string[]) =>
  useQueries({
    queries: examIds.map((id) => ({
      queryKey: EXAM_KEYS.detail(id),
      queryFn: () => examService.getExamDetails(id),
      staleTime: 1000 * 60 * 5,
    })),
  });

export const useReportCard = (examId?: string, studentId?: string) =>
  useQuery({
    queryKey: EXAM_KEYS.reportCard(examId ?? '', studentId ?? ''),
    queryFn: () => examService.getStudentReportCard(examId!, studentId!),
    enabled: Boolean(examId && studentId),
    staleTime: 1000 * 60 * 5,
    retry: false, // 404 = marks not published yet; don't hammer the API
  });

export const useReportCards = (examIds: string[], studentId?: string) =>
  useQueries({
    queries: examIds.map((id) => ({
      queryKey: EXAM_KEYS.reportCard(id, studentId ?? ''),
      queryFn: () => examService.getStudentReportCard(id, studentId!),
      enabled: Boolean(studentId),
      staleTime: 1000 * 60 * 5,
      retry: false,
    })),
  });

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamDto) => examService.createExam(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAM_KEYS.list() }),
  });
};

export const useAddExamSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: AddExamSubjectDto }) =>
      examService.addExamSubject(examId, data),
    onSuccess: (_res, { examId }) => {
      queryClient.invalidateQueries({ queryKey: EXAM_KEYS.detail(examId) });
      queryClient.invalidateQueries({ queryKey: EXAM_KEYS.list() });
    },
  });
};

export const useSubmitMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitMarksDto) => examService.submitMarks(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...EXAM_KEYS.all, 'report-card'] }),
  });
};
