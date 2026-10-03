import React, { useState } from 'react';
import {
  Bell,
  Pin,
  Plus,
  Calendar,
  User,
  Users,
  Search,
  Sparkles,
  Tag,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';
import { Announcement } from '../types';
import { useAuth } from '../context/AuthContext';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

type AnnouncementFilter = 'All' | 'Academic' | 'Events' | 'Exam' | 'General' | 'Important';

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  announcements = [],
  onRefresh = () => {},
  onAddToast,
}) => {
  const safeAnnouncements = announcements || [];
  const { currentUser, authFetch } = useAuth();
  const canPost = currentUser?.role === 'ADMIN' || currentUser?.role === 'TEACHER';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<AnnouncementFilter>('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Academic' as Announcement['category'],
    target_audience: 'ALL' as Announcement['target_audience'],
    pinned: false,
  });

  const filteredAnnouncements = safeAnnouncements.filter((a) => {
    // Category / Important filter
    if (activeCategory === 'Important') {
      if (!a.pinned) return false;
    } else if (activeCategory !== 'All') {
      if (a.category !== activeCategory) return false;
    }

    // Search query
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.author_name && a.author_name.toLowerCase().includes(q))
    );
  });

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      onAddToast('Title and announcement content are required', 'error');
      return;
    }

    try {
      const res = await authFetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onAddToast('Campus announcement broadcasted', 'success', 'Notice Published');
        setIsPostModalOpen(false);
        setForm({
          title: '',
          content: '',
          category: 'Academic',
          target_audience: 'ALL',
          pinned: false,
        });
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to post announcement', 'error');
      }
    } catch {
      onAddToast('Network error posting announcement', 'error');
    }
  };

  const categories: AnnouncementFilter[] = ['All', 'Academic', 'Events', 'Exam', 'General', 'Important'];

  return (
    <div id="announcements-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Campus Communications
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Official Announcements & Notices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verified institutional circulars, academic notifications, and departmental bulletins.
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'Important' ? '📌 Important' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search circulars..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 hover:shadow-md flex flex-col justify-between space-y-4 ${
              item.pinned
                ? 'border-indigo-400 dark:border-indigo-500/60 ring-1 ring-indigo-400/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      <Pin className="w-3 h-3 fill-indigo-600" /> Pinned
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Users className="w-3 h-3" /> {item.target_audience}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>{item.created_at}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.content}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Author: <strong className="text-slate-700 dark:text-slate-300">{item.author_name}</strong> ({item.author_role})
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No announcements found</p>
          <p className="text-xs text-slate-400 mt-1">There are no circulars matching your active filter criteria.</p>
        </div>
      )}

      {/* Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Publish Campus Notice
              </h2>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePost} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Circular Subject *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Schedule for End-Semester Practical Examinations"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam</option>
                    <option value="Events">Events</option>
                    <option value="General">General</option>
                    <option value="House">House</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => setForm({ ...form, target_audience: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="ALL">Entire Campus (All)</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="TEACHERS">Faculty / Teachers Only</option>
                    <option value="CSE">CSE Department</option>
                    <option value="IT">IT Department</option>
                    <option value="AI&DS">AI&DS Department</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Detail the circular requirements, instructions, and deadlines..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="chk-pinned"
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="chk-pinned" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Pin to top of bulletin board
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
