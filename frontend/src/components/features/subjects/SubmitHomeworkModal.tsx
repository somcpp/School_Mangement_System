/**
 * @file SubmitHomeworkModal.tsx
 * @description Homework submission dialog: optional file upload to storage, note to teacher,
 * and a real POST /assignments/:id/submit.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { uploadService } from '../../../services/upload.service';
import { useSubmitAssignment } from '../../../hooks';
import { dueLabel, type HomeworkItem } from './subjectHelpers';

interface SubmitHomeworkModalProps {
  item: HomeworkItem;
  teacherName?: string;
  onClose: () => void;
}

export const SubmitHomeworkModal: React.FC<SubmitHomeworkModalProps> = ({ item, teacherName, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<{ url: string; name: string; size?: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const submit = useSubmitAssignment();

  // Close a moment after the success state is shown; clean up if unmounted early
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [success, onClose]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadService.uploadFile(picked, 'homework');
      setFile({ url: res.url, name: res.originalName, size: res.size });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again or submit a note only.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async () => {
    if (file) await uploadService.deleteFile(file.url).catch(() => null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file && !note.trim()) {
      setError('Attach a file or write a short note before submitting.');
      return;
    }
    submit.mutate(
      {
        assignmentId: item.id,
        payload: {
          content: note.trim() || undefined,
          // The API validates a full URL; local storage returns a relative path
          attachmentUrl: file ? uploadService.getFileUrl(file.url) : undefined,
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        },
        onError: (err: any) =>
          setError(err?.response?.data?.message || 'Could not submit your homework. Please try again.'),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Submit ${item.title}`}
        className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-border space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {dueLabel(item)} • Max {item.maxMarks} marks
            </span>
            <h3 className="text-lg font-bold text-primary">{item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl hover:bg-surface-raised text-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-accent-green-subtle text-accent-green flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-primary">Homework Submitted!</h4>
            <p className="text-xs text-secondary">
              Delivered to <strong>{teacherName ?? 'your teacher'}</strong> for evaluation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-secondary block mb-1.5">Upload Notebook Scans / Assignment PDF</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFile}
                className="hidden"
              />

              {uploading ? (
                <div className="border-2 border-dashed border-accent-blue/50 p-6 rounded-2xl text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-accent-blue animate-spin mx-auto" />
                  <p className="font-bold text-primary text-xs">Uploading file…</p>
                </div>
              ) : file ? (
                <div className="p-4 rounded-2xl bg-surface-raised border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-accent-blue-subtle text-accent-blue flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-primary truncate text-xs">{file.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        {file.size && <span>{(file.size / 1024).toFixed(1)} KB</span>}
                        <span className="text-accent-green font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready to submit
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={uploadService.getFileUrl(file.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-surface hover:bg-border text-accent-blue border border-border transition-all"
                      title="Preview file"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-accent-blue p-6 rounded-2xl text-center cursor-pointer transition-all bg-surface-raised group"
                >
                  <Upload className="w-8 h-8 text-accent-blue mx-auto mb-2 group-hover:-translate-y-0.5 transition-transform" />
                  <p className="font-bold text-primary">Click to select a file (PDF, PNG, JPG, DOC)</p>
                  <span className="text-[10px] text-muted block mt-1">Max 10 MB</span>
                </button>
              )}
            </div>

            <div>
              <label htmlFor="homework-note" className="font-bold text-secondary block mb-1.5">
                Note to Teacher {file ? '(Optional)' : ''}
              </label>
              <textarea
                id="homework-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I solved questions 1–8. I had a doubt on question 6."
                className="w-full p-3 rounded-2xl bg-surface-raised border border-border text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-border text-secondary font-bold text-xs hover:bg-surface-raised cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submit.isPending || uploading}
                className="px-6 py-2.5 rounded-full bg-accent-blue text-white font-bold text-xs shadow-card hover:bg-brand-sky-dark transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submit.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Teacher</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
