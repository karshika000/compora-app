import React, { useState } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Trophy,
  Shield,
  Star,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Achievement,
  Student,
  HouseName,
  HouseStats,
  AchievementCategory,
} from '../types';
import { calculateAchievementPoints, HOUSES } from '../utils/stats';
import { POINT_SYSTEM } from '../data/initialData';
import { HOUSE_THEMES, getHouseTheme } from '../utils/houseTheme';

interface AchievementsViewProps {
  achievements: Achievement[];
  students: Student[];
  houseStats: HouseStats[];
  onAddAchievement: (achievement: Omit<Achievement, 'id'>) => Promise<boolean>;
  onEditAchievement: (id: string, updates: Partial<Achievement>) => Promise<boolean>;
  onDeleteAchievement: (id: string) => Promise<boolean>;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements = [],
  students = [],
  houseStats = [],
  onAddAchievement,
  onEditAchievement,
  onDeleteAchievement,
}) => {
  const safeAchievements = achievements || [];
  const safeStudents = students || [];
  const safeHouseStats = houseStats || [];

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [houseFilter, setHouseFilter] = useState('All');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deletingAchievement, setDeletingAchievement] = useState<Achievement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    category: 'Technical' as AchievementCategory,
    level: 'National' as 'College' | 'District' | 'State' | 'National',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Map student_id to Student object
  const studentMap = new Map<string, Student>();
  safeStudents.forEach((s) => studentMap.set(s.student_id, s));

  // Filtered Achievements
  const filteredAchievements = safeAchievements.filter((ach) => {
    const student = studentMap.get(ach.student_id);
    const matchSearch =
      ach.title.toLowerCase().includes(search.toLowerCase()) ||
      ach.student_id.toLowerCase().includes(search.toLowerCase()) ||
      (student && student.name.toLowerCase().includes(search.toLowerCase()));

    const matchLevel = levelFilter === 'All' || ach.level === levelFilter;
    const matchCategory = categoryFilter === 'All' || ach.category === categoryFilter;
    const matchHouse = houseFilter === 'All' || (student && student.house === houseFilter);

    return matchSearch && matchLevel && matchCategory && matchHouse;
  });

  const handleOpenAdd = () => {
    setFormData({
      student_id: students[0]?.student_id || '',
      title: '',
      category: 'Technical',
      level: 'National',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (ach: Achievement) => {
    setEditingAchievement(ach);
    setFormData({
      student_id: ach.student_id,
      title: ach.title,
      category: ach.category,
      level: ach.level,
      date: ach.date,
      description: ach.description || '',
    });
    setFormError('');
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.title.trim()) {
      setFormError('Please select a student and provide an achievement title.');
      return;
    }

    setSubmitting(true);
    const success = await onAddAchievement(formData);
    setSubmitting(false);

    if (success) {
      setIsAddOpen(false);
    } else {
      setFormError('Failed to record achievement.');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement) return;

    setSubmitting(true);
    const success = await onEditAchievement(editingAchievement.id, formData);
    setSubmitting(false);

    if (success) {
      setEditingAchievement(null);
    } else {
      setFormError('Failed to update achievement.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAchievement) return;
    setSubmitting(true);
    await onDeleteAchievement(deletingAchievement.id);
    setSubmitting(false);
    setDeletingAchievement(null);
  };

  const levelStyle = (lvl: string) => {
    switch (lvl) {
      case 'National':
        return 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'State':
        return 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      case 'District':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const resetFilters = () => {
    setSearch('');
    setLevelFilter('All');
    setCategoryFilter('All');
    setHouseFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Module 04
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Student Achievements & Honors Central
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified academic, technical, sports, and cultural awards that directly feed the House Championship.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Achievement</span>
        </button>
      </div>

      {/* Official Scoring Matrix Reference Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              National Level
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Apex tier events</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-600 text-white shadow-xs font-mono">
            +40 pts
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              State Level
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Inter-University</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-sky-600 text-white shadow-xs font-mono">
            +30 pts
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              District Level
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Zonal / Regional</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-600 text-white shadow-xs font-mono">
            +20 pts
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              College Level
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Intra-campus</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-700 dark:bg-slate-600 text-white shadow-xs font-mono">
            +10 pts
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, student name or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Level Filter */}
        <div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="All">All Competitive Tiers</option>
            <option value="National">National Tier (+40 pts)</option>
            <option value="State">State Tier (+30 pts)</option>
            <option value="District">District Tier (+20 pts)</option>
            <option value="College">College Tier (+10 pts)</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="All">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Sports">Sports</option>
            <option value="Cultural">Cultural</option>
            <option value="Innovation">Innovation</option>
            <option value="Academic">Academic</option>
            <option value="Leadership">Leadership</option>
          </select>
        </div>

        {/* House Filter */}
        <div>
          <select
            value={houseFilter}
            onChange={(e) => setHouseFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="All">All Houses</option>
            {HOUSES.map((h) => (
              <option key={h} value={h}>
                {h} House
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Achievements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filteredAchievements.length} of {achievements.length} verified awards
          </span>
          {(search || levelFilter !== 'All' || categoryFilter !== 'All' || houseFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Achievement Title</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Department & House</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-4 text-center">Points</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        No achievements found
                      </p>
                      <p className="text-xs text-slate-400">
                        No awards match your current filters.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((ach) => {
                  const student = studentMap.get(ach.student_id);
                  const pts = calculateAchievementPoints(ach.level);
                  const theme = student ? getHouseTheme(student.house) : null;

                  return (
                    <tr
                      key={ach.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs">
                        <div>{ach.title}</div>
                        {ach.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-normal mt-0.5">
                            {ach.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {student?.name || 'Unknown Student'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {ach.student_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {student?.department} • {student?.year}
                        </div>
                        {theme && (
                          <div
                            className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold mt-0.5 ${theme.badgeBg} ${theme.badgeText}`}
                          >
                            {student?.house} House
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {ach.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${levelStyle(
                            ach.level
                          )}`}
                        >
                          {ach.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                          +{pts} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        {ach.date}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(ach)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Achievement"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingAchievement(ach)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Delete Achievement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Achievement Modal */}
      {(isAddOpen || editingAchievement) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isAddOpen ? 'Record Student Achievement' : 'Edit Achievement Details'}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingAchievement(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <form
              onSubmit={isAddOpen ? handleSubmitAdd : handleSubmitEdit}
              className="space-y-4 text-xs"
            >
              {/* Student Picker */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Student <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.student_id}
                  disabled={!isAddOpen}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_id} - {s.name} ({s.department}, {s.house} House)
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Award / Honor Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place - National Smart India Hackathon"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as AchievementCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Innovation">Innovation</option>
                    <option value="Academic">Academic</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Competitive Tier
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="National">National (40 pts)</option>
                    <option value="State">State (30 pts)</option>
                    <option value="District">District (20 pts)</option>
                    <option value="College">College (10 pts)</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Award Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Verification Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Details regarding organizing body, certificate number, or contest ranking..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingAchievement(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : isAddOpen
                    ? 'Verify & Credit Points'
                    : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAchievement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Delete Honor Record?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">"{deletingAchievement.title}"</strong>? The corresponding House points will be deducted immediately.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingAchievement(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Honor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
