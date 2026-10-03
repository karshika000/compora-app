import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Users,
  Search,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  X,
  Shield,
  Tag,
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CollegeEvent, Student, EventParticipation, HouseName } from '../types';
import { DEPARTMENTS, calculateEventHouseBreakdown } from '../utils/stats';
import { HOUSE_THEMES, getHouseTheme } from '../utils/houseTheme';

interface EventsViewProps {
  events: CollegeEvent[];
  students: Student[];
  participations: EventParticipation[];
  onAddEvent: (event: Omit<CollegeEvent, 'id'>) => Promise<boolean>;
  onEditEvent: (id: string, updates: Partial<CollegeEvent>) => Promise<boolean>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  onSaveParticipants: (eventId: string, studentIds: string[]) => Promise<boolean>;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events = [],
  students = [],
  participations = [],
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onSaveParticipants,
}) => {
  const safeEvents = events || [];
  const safeStudents = students || [];
  const safeParticipations = participations || [];

  // Search & Filter
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Ongoing' | 'Completed'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CollegeEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CollegeEvent | null>(null);

  // Participant Management Modal State
  const [managingEvent, setManagingEvent] = useState<CollegeEvent | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');
  const [studentHouseFilter, setStudentHouseFilter] = useState('All');
  const [studentDeptFilter, setStudentDeptFilter] = useState('All');
  const [savingParticipants, setSavingParticipants] = useState(false);

  // Event Form State
  const [formData, setFormData] = useState({
    name: '',
    department: 'CSE',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Technical',
    venue: 'Main Campus Auditorium',
    status: 'Upcoming' as 'Upcoming' | 'Ongoing' | 'Completed',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtered Events
  const filteredEvents = safeEvents.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue && e.venue.toLowerCase().includes(search.toLowerCase()));
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    const matchStatus = statusFilter === 'All' || (e.status || 'Upcoming') === statusFilter;
    const matchCategory = categoryFilter === 'All' || (e.category || 'Technical') === categoryFilter;
    return matchSearch && matchDept && matchStatus && matchCategory;
  });

  // Open Participant Management Modal
  const handleOpenParticipants = (event: CollegeEvent) => {
    setManagingEvent(event);
    const existingParts = participations
      .filter((p) => p.event_id === event.id)
      .map((p) => p.student_id);
    setSelectedStudentIds(new Set(existingParts));
    setStudentSearch('');
    setStudentHouseFilter('All');
    setStudentDeptFilter('All');
  };

  const toggleStudentSelection = (studentId: string) => {
    const updated = new Set(selectedStudentIds);
    if (updated.has(studentId)) {
      updated.delete(studentId);
    } else {
      updated.add(studentId);
    }
    setSelectedStudentIds(updated);
  };

  const handleSelectAllFiltered = (filteredStudents: Student[]) => {
    const updated = new Set(selectedStudentIds);
    filteredStudents.forEach((s) => updated.add(s.student_id));
    setSelectedStudentIds(updated);
  };

  const handleDeselectAllFiltered = (filteredStudents: Student[]) => {
    const updated = new Set(selectedStudentIds);
    filteredStudents.forEach((s) => updated.delete(s.student_id));
    setSelectedStudentIds(updated);
  };

  const handleSaveParticipants = async () => {
    if (!managingEvent) return;
    setSavingParticipants(true);
    await onSaveParticipants(managingEvent.id, Array.from(selectedStudentIds));
    setSavingParticipants(false);
    setManagingEvent(null);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      department: 'CSE',
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'Technical',
      venue: 'Main Campus Auditorium',
      status: 'Upcoming',
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (event: CollegeEvent) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      department: event.department,
      date: event.date,
      description: event.description,
      category: event.category || 'Technical',
      venue: event.venue || 'Main Campus Auditorium',
      status: event.status || 'Upcoming',
    });
    setFormError('');
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setFormError('Event name and description are required.');
      return;
    }

    setSubmitting(true);
    const success = await onAddEvent(formData);
    setSubmitting(false);

    if (success) {
      setIsAddOpen(false);
    } else {
      setFormError('Failed to create event.');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setSubmitting(true);
    const success = await onEditEvent(editingEvent.id, formData);
    setSubmitting(false);

    if (success) {
      setEditingEvent(null);
    } else {
      setFormError('Failed to update event.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setSubmitting(true);
    await onDeleteEvent(deletingEvent.id);
    setSubmitting(false);
    setDeletingEvent(null);
  };

  const clearAllFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Module 03
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            College Events & Participation Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish events, manage student registrations, and allocate 5 House points per participant.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search events by title, venue, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-56">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Departments / Hosts</option>
              <option value="General">General / Inter-College</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d} Department
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Academic">Academic</option>
              <option value="Hackathon">Hackathon</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-2 shrink-0">
            Status:
          </span>
          {(['All', 'Upcoming', 'Ongoing', 'Completed'] as const).map((st) => {
            const count =
              st === 'All'
                ? events.length
                : events.filter((e) => (e.status || 'Upcoming') === st).length;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {(search || deptFilter !== 'All' || statusFilter !== 'All' || categoryFilter !== 'All') && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.length === 0 ? (
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              No Events Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No collegiate events match your current filter parameters. Try clearing your search query or schedule a new event.
            </p>
            <div className="pt-2">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const eventParts = participations.filter((p) => p.event_id === event.id);
            const houseBreakdown = calculateEventHouseBreakdown(event.id, participations, students);

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Top Bar: Dept Badge, Status, Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {event.department}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          event.status === 'Completed'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : event.status === 'Ongoing'
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {event.status || 'Upcoming'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {event.date}
                      </span>
                    </div>
                  </div>

                  {/* Title & Category & Venue */}
                  <div className="mb-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug font-display">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Tag className="w-3 h-3 text-slate-400" /> {event.category || 'General'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" /> {event.venue || 'Auditorium'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* House-wise Participation Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Registered Students:</span>
                      </span>
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                        {eventParts.length} Students
                      </span>
                    </div>

                    {/* House-wise chips */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      {(['Red', 'Blue', 'Green', 'Yellow'] as const).map((hName) => {
                        const theme = getHouseTheme(hName);
                        return (
                          <div
                            key={hName}
                            className={`p-1.5 rounded-xl border ${theme.badgeBorder} ${theme.badgeBg}`}
                          >
                            <span className={`block text-[10px] font-bold ${theme.badgeText}`}>
                              {theme.emoji} {hName}
                            </span>
                            <span className={`font-black text-xs ${theme.badgeText}`}>
                              {houseBreakdown[hName]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenParticipants(event)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Participants</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                      title="Edit event"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingEvent(event)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Participant Management Modal */}
      {managingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Event Registration: {managingEvent.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select student participants. Each confirmed attendee awards +5 points to their House.
                </p>
              </div>
              <button
                onClick={() => setManagingEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={studentHouseFilter}
                onChange={(e) => setStudentHouseFilter(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="All">All Houses</option>
                <option value="Red">Red House</option>
                <option value="Blue">Blue House</option>
                <option value="Green">Green House</option>
                <option value="Yellow">Yellow House</option>
              </select>

              <select
                value={studentDeptFilter}
                onChange={(e) => setStudentDeptFilter(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Bulk Select / Deselect */}
            {(() => {
              const modalFilteredStudents = students.filter((s) => {
                const matchSearch =
                  s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.student_id.toLowerCase().includes(studentSearch.toLowerCase());
                const matchHouse =
                  studentHouseFilter === 'All' || s.house === studentHouseFilter;
                const matchDept =
                  studentDeptFilter === 'All' || s.department === studentDeptFilter;
                return matchSearch && matchHouse && matchDept;
              });

              return (
                <>
                  <div className="flex items-center justify-between text-xs py-1 text-slate-500 dark:text-slate-400">
                    <span className="font-medium">
                      Showing {modalFilteredStudents.length} of {students.length} students ({selectedStudentIds.size} registered)
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleSelectAllFiltered(modalFilteredStudents)}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Select All Visible
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleDeselectAllFiltered(modalFilteredStudents)}
                        className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Deselect All Visible
                      </button>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 max-h-72">
                    {modalFilteredStudents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No students found matching current filters.
                      </div>
                    ) : (
                      modalFilteredStudents.map((st) => {
                        const isSelected = selectedStudentIds.has(st.student_id);
                        const theme = getHouseTheme(st.house);

                        return (
                          <div
                            key={st.id}
                            onClick={() => toggleStudentSelection(st.student_id)}
                            className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs ${
                              isSelected
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/50 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button className="text-indigo-600 dark:text-indigo-400">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                )}
                              </button>
                              <div>
                                <span className="text-slate-900 dark:text-white">{st.name}</span>
                                <span className="text-slate-400 text-[11px] ml-2 font-mono">
                                  {st.student_id} • {st.department} ({st.year})
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${theme.badgeBg} ${theme.badgeText}`}
                            >
                              {st.house}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Total Registrations: {selectedStudentIds.size} (+{selectedStudentIds.size * 5} House Pts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManagingEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveParticipants}
                  disabled={savingParticipants}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {savingParticipants ? 'Saving...' : 'Save & Update Standings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Schedule New College Event
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Robotics Symposium 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hosting Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="General">General / Inter-College</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                    <option value="Hackathon">Hackathon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium / Stadium"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event scope, eligibility, and rules..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Edit Event: {editingEvent.name}
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="General">General</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Delete Event?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">"{deletingEvent.name}"</strong>? All participant records linked to this event will be deleted.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
