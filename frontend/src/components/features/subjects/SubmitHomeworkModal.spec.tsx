/**
 * @file SubmitHomeworkModal.spec.tsx
 * @description The submission dialog must call the real submit mutation (not fake success),
 * validate empty submissions and surface API errors.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SubmitHomeworkModal } from './SubmitHomeworkModal';
import type { HomeworkItem } from './subjectHelpers';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('../../../hooks', () => ({
  useSubmitAssignment: () => ({ mutate, isPending: false }),
}));
vi.mock('../../../services/upload.service', () => ({
  uploadService: { uploadFile: vi.fn(), deleteFile: vi.fn(), getFileUrl: (u: string) => u },
}));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const item: HomeworkItem = {
  id: 'asg-1',
  subjectId: 'sci',
  title: "Ohm's Law Lab Report",
  description: 'Write up the readings',
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  maxMarks: 25,
  status: 'PENDING',
};

describe('SubmitHomeworkModal', () => {
  beforeEach(() => mutate.mockReset());

  it('refuses an empty submission without calling the API', () => {
    render(<SubmitHomeworkModal item={item} teacherName="Priya Patel" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /send to teacher/i }));
    expect(screen.getByText(/attach a file or write a short note/i)).toBeTruthy();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits the note to the assignment and shows success', () => {
    mutate.mockImplementation((_vars: unknown, opts?: { onSuccess: () => void }) => opts?.onSuccess());
    render(<SubmitHomeworkModal item={item} teacherName="Priya Patel" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/note to teacher/i), { target: { value: '  Graph attached in notebook  ' } });
    fireEvent.click(screen.getByRole('button', { name: /send to teacher/i }));

    expect(mutate).toHaveBeenCalledWith(
      { assignmentId: 'asg-1', payload: { content: 'Graph attached in notebook', attachmentUrl: undefined } },
      expect.any(Object)
    );
    expect(screen.getByText(/homework submitted/i)).toBeTruthy();
    expect(screen.getByText('Priya Patel')).toBeTruthy();
  });

  it('shows the API error message when submission fails', () => {
    mutate.mockImplementation((_vars: unknown, opts?: { onError: (e: unknown) => void }) =>
      opts?.onError({ response: { data: { message: 'Only students can submit assignments' } } })
    );
    render(<SubmitHomeworkModal item={item} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/note to teacher/i), { target: { value: 'done' } });
    fireEvent.click(screen.getByRole('button', { name: /send to teacher/i }));
    expect(screen.getByText('Only students can submit assignments')).toBeTruthy();
  });
});
