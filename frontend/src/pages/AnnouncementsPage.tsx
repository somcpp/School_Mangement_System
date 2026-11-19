/**
 * @file AnnouncementsPage.tsx
 * @description Notice Board & School Circulars Orchestrator.
 * Powered by TanStack Query, typed services, and integrated file upload attachments.
 */

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAnnouncements } from '../hooks';
import {
  NoticeFilters,
  NoticeCard,
  PublishNoticeModal,
} from '../components/features/announcements';
import type { Announcement } from '../types';


export const AnnouncementsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // TanStack Query
  const noticesQuery = useAnnouncements();
  const { isLoading } = noticesQuery;
  const notices = useMemo(() => noticesQuery.data ?? [], [noticesQuery.data]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' ||
        n.priority === selectedCategory ||
        (n.category && n.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [notices, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Notice Board &amp; Announcements</h1>
          <p className="text-sm text-secondary">
            School circulars, exam notifications, and campus event updates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue text-white font-semibold text-sm shadow-card hover:bg-brand-sky-dark transition-all self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* Filters */}
      <NoticeFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Notices List */}
      {isLoading ? (
        <div className="bg-surface rounded-3xl border border-border shadow-card p-12 text-center">
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted font-medium">Loading school circulars...</p>
        </div>
      ) : noticesQuery.isError ? (
        <div className="bg-surface rounded-3xl border border-border shadow-card p-12 text-center">
          <p className="text-sm font-bold text-primary">Could not load the notice board</p>
          <button
            type="button"
            onClick={() => noticesQuery.refetch()}
            className="mt-3 px-4 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold shadow-sm cursor-pointer active:scale-95"
          >
            Retry
          </button>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-border shadow-card p-12 text-center">
          <p className="text-sm font-bold text-primary">No circulars found</p>
          <p className="text-xs text-muted mt-1">Try selecting a different filter or search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice, idx) => (
            <NoticeCard key={notice.id} notice={notice} index={idx} />
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      <PublishNoticeModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />
    </div>
  );
};

export default AnnouncementsPage;
