import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  Tag,
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  Bell,
  Sparkles,
  Layers,
  X,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  CalendarRange,
  List,
  Eye,
  Info,
  Download,
  ExternalLink,
  Share2,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventCategory,
  UserRole,
  DepartmentName,
  AcademicYear,
  Teacher,
  AcademicClass,
  Subject,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  downloadIcsFile,
  generateCalendarEventsIcs,
  generateGoogleCalendarUrl,
} from '../utils/icsExport';

interface CalendarViewProps {
  events?: CalendarEvent[];
  teachers?: Teacher[];
  classes?: AcademicClass[];
  subjects?: Subject[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

const CATEGORY_COLORS: Record<
  CalendarEventCategory,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
    icon: any;
  }
> = {
  Class: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-300 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
    dot: 'bg-blue-500',
    icon: BookOpen,
  },
  Assignment: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
    dot: 'bg-amber-500',
    icon: FileText,
  },
  Exam: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-300 dark:border-rose-700',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200',
    dot: 'bg-rose-500',
    icon: GraduationCap,
  },
  Event: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-300 dark:border-indigo-700',
    badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200',
    dot: 'bg-indigo-500',
    icon: CalendarDays,
  },
  Competition: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-300 dark:border-yellow-700',
    badge: 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200',
    dot: 'bg-yellow-500',
    icon: Award,
  },
  Announcement: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-700',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
    dot: 'bg-emerald-500',
    icon: Bell,
  },
  Holiday: {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-300 dark:border-slate-600',
    badge: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
    dot: 'bg-slate-500',
    icon: Sparkles,
  },
  Deadline: {
    bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
    badge: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200',
    dot: 'bg-red-600',
    icon: Clock,
  },
};

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events = [],
  teachers = [],
  classes = [],
  subjects = [],
  onRefresh = () => {},
  onAddToast,
}) => {
  const { currentUser, authFetch } = useAuth();
  const role: UserRole = currentUser?.role || 'STUDENT';
  const canManage = role === 'ADMIN' || role === 'TEACHER';

  // Navigation Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedEventModal, setSelectedEventModal] = useState<CalendarEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Event' as CalendarEventCategory,
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:30',
    location: 'Main Auditorium',
    description: '',
    department: 'ALL' as DepartmentName | 'ALL',
    year: 'ALL' as AcademicYear | 'ALL',
    section: 'ALL',
    target_audience: 'ALL',
  });

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Year & Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Previous month padding
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon
    // Make Monday first day (0 = Mon, 6 = Sun)
    const paddingCount = (startingDayOfWeek + 6) % 7;
    for (let i = paddingCount; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Next month padding (to complete 35 or 42 grid slots)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [year, month]);

  // Week days
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - ((curr.getDay() + 6) % 7); // Monday
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(curr.setDate(first + i)));
    }
    return days;
  }, [currentDate]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (selectedCategory !== 'All' && evt.category !== selectedCategory) return false;
      if (selectedDept !== 'All' && evt.department && evt.department !== 'ALL' && evt.department !== selectedDept) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchLoc = evt.location?.toLowerCase().includes(q);
        const matchOrg = evt.organizer?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchOrg) return false;
      }
      return true;
    });
  }, [events, selectedCategory, selectedDept, searchQuery]);

  // Map events to date string "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((evt) => {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    });
    return map;
  }, [filteredEvents]);

  // Navigate Date
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 1);
      setCurrentDate(next);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // iCalendar (.ics) Export Handlers
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExportIcs = (scope: 'all' | 'filtered' | 'month' = 'filtered') => {
    let exportList = filteredEvents;
    let filename = 'compora_academic_schedule.ics';
    let title = 'COMPORA Academic Schedule';

    if (scope === 'all') {
      exportList = events;
      filename = 'compora_all_college_events.ics';
      title = 'COMPORA - Complete Calendar';
    } else if (scope === 'month') {
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      exportList = events.filter((e) => e.date.startsWith(monthPrefix));
      filename = `compora_schedule_${monthNames[month].toLowerCase()}_${year}.ics`;
      title = `COMPORA - ${monthNames[month]} ${year} Schedule`;
    }

    if (exportList.length === 0) {
      onAddToast('No calendar events to export for the selected scope.', 'warning', 'Empty Export');
      return;
    }

    const icsContent = generateCalendarEventsIcs(exportList, title);
    downloadIcsFile(filename, icsContent);
    onAddToast(
      `Exported ${exportList.length} events to ${filename}. Ready to sync with Google Calendar, Apple Calendar, or Outlook!`,
      'success',
      'iCalendar (.ics) Downloaded'
    );
    setIsExportMenuOpen(false);
  };

  const handleExportSingleEventIcs = (evt: CalendarEvent) => {
    const icsContent = generateCalendarEventsIcs([evt], evt.title);
    const cleanName = evt.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    downloadIcsFile(`${cleanName}.ics`, icsContent);
    onAddToast(`Exported "${evt.title}" to .ics file.`, 'success', 'Event Exported');
  };

  // Submit Create Event
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
      setFormError('Please fill in title, date, and times.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setFormError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await authFetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onAddToast(`Event "${formData.title}" added to calendar!`, 'success', 'Calendar Updated');
        setIsCreateModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to create calendar event.');
      }
    } catch {
      setFormError('Network error creating calendar event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Event
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventModal) return;

    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
      setFormError('Please fill in title, date, and times.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setFormError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await authFetch(`/api/calendar/${selectedEventModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onAddToast(`Event "${formData.title}" updated!`, 'success', 'Calendar Updated');
        setIsEditModalOpen(false);
        setSelectedEventModal(null);
        onRefresh();
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to update calendar event.');
      }
    } catch {
      setFormError('Network error updating calendar event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this event from the calendar?')) return;

    try {
      const res = await authFetch(`/api/calendar/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onAddToast('Event deleted from calendar.', 'info');
        setSelectedEventModal(null);
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to delete event.', 'error');
      }
    } catch {
      onAddToast('Network error deleting calendar event.', 'error');
    }
  };

  const openCreateModal = (dateStr?: string) => {
    setFormData({
      title: '',
      category: 'Event',
      date: dateStr || new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '11:30',
      location: 'Main Auditorium',
      description: '',
      department: 'ALL',
      year: 'ALL',
      section: 'ALL',
      target_audience: 'ALL',
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (evt: CalendarEvent) => {
    setFormData({
      title: evt.title,
      category: evt.category,
      date: evt.date,
      start_time: evt.start_time,
      end_time: evt.end_time,
      location: evt.location || '',
      description: evt.description || '',
      department: evt.department || 'ALL',
      year: evt.year || 'ALL',
      section: evt.section || 'ALL',
      target_audience: evt.target_audience || 'ALL',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const categories: (CalendarEventCategory | 'All')[] = [
    'All',
    'Class',
    'Assignment',
    'Exam',
    'Event',
    'Competition',
    'Announcement',
    'Holiday',
    'Deadline',
  ];

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div id="smart-calendar-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Campus Master Timetable & Activity Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Smart Collegiate Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Unified schedule synchronizing coursework classes, assignment deadlines, university examinations, hackathons, and holiday declarations.
          </p>
        </div>

        {/* Header Action Buttons: Export & Create */}
        <div className="flex items-center gap-2.5 shrink-0 z-10">
          {/* iCalendar (.ics) Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
              title="Export schedule to Google Calendar, Apple Calendar, or Outlook"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">Export to iCal (.ics)</span>
              <span className="sm:hidden">.ics</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Sync External Calendars
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Import into Google, Apple, or Outlook
                  </div>
                </div>

                <div className="space-y-1 py-1">
                  <button
                    onClick={() => handleExportIcs('filtered')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>Export Visible Events</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                      {filteredEvents.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleExportIcs('month')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>Export {monthNames[month]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                      Month
                    </span>
                  </button>

                  <button
                    onClick={() => handleExportIcs('all')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>Export All Events</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                      {events.length}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create Action for Admin/Teachers */}
          {canManage && (
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: View Switcher, Month Navigation, Filters */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navigation Month / Title */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white min-w-[180px]">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Category Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Category Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'All' ? 'All Items' : cat}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MONTH VIEW                                            */}
      {/* ======================================================== */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-center py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {daysInMonth.map((dayObj, idx) => {
              const dateStr = formatDateKey(dayObj);
              const isCurrentMonth = dayObj.getMonth() === month;
              const isToday = formatDateKey(new Date()) === dateStr;
              const dayEvents = eventsByDate.get(dateStr) || [];

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (canManage) openCreateModal(dateStr);
                  }}
                  className={`min-h-[110px] sm:min-h-[125px] p-2 transition flex flex-col justify-between cursor-pointer group ${
                    isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20'
                      : 'bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 opacity-60'
                  }`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayObj.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event pills */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const color = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Event;
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventModal(evt);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate flex items-center gap-1 border transition hover:scale-102 ${color.bg}`}
                          title={`${evt.title} (${evt.start_time} - ${evt.end_time})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.dot}`} />
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-400 pl-1">
                        +{dayEvents.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WEEK VIEW                                             */}
      {/* ======================================================== */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
          <div className="min-w-[750px]">
            {/* Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 py-3">
              {weekDays.map((d, i) => {
                const dateKey = formatDateKey(d);
                const isToday = formatDateKey(new Date()) === dateKey;
                return (
                  <div key={i} className="text-center">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </div>
                    <div
                      className={`text-sm font-black mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {d.getDate()} {monthNames[d.getMonth()].slice(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week Day Columns */}
            <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 min-h-[400px]">
              {weekDays.map((d, i) => {
                const dateKey = formatDateKey(d);
                const dayEvents = eventsByDate.get(dateKey) || [];

                return (
                  <div key={i} className="p-2 space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-600 italic py-8">
                        No items
                      </div>
                    ) : (
                      dayEvents.map((evt) => {
                        const color = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Event;
                        return (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEventModal(evt)}
                            className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition hover:shadow-md space-y-1 ${color.bg}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold">
                                {evt.start_time} - {evt.end_time}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                            </div>
                            <div className="font-bold text-xs line-clamp-2">
                              {evt.title}
                            </div>
                            {evt.location && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{evt.location}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DAY VIEW                                              */}
      {/* ======================================================== */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <p className="text-xs text-slate-400">
                Detailed timeline for scheduled lectures, assignments, and campus activities.
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => openCreateModal(formatDateKey(currentDate))}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(eventsByDate.get(formatDateKey(currentDate)) || []).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ☕ No scheduled events or classes on this day.
              </div>
            ) : (
              (eventsByDate.get(formatDateKey(currentDate)) || []).map((evt) => {
                const color = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Event;
                const IconComponent = color.icon;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md transition ${color.bg}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl ${color.badge} shrink-0 mt-0.5`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {evt.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${color.badge}`}>
                            {evt.category}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1 font-mono font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {evt.start_time} – {evt.end_time}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {evt.location}
                            </span>
                          )}
                          {evt.organizer && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {evt.organizer}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs self-start sm:self-auto shrink-0">
                      View Details
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. AGENDA / UPCOMING LIST VIEW                           */}
      {/* ======================================================== */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
                Upcoming Academic Agenda ({filteredEvents.length})
              </h3>
              <p className="text-xs text-slate-400">
                Chronological list of all collegiate schedules, exams, hackathons, and deadlines.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No matching agenda items found.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const color = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Event;
                const IconComponent = color.icon;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-indigo-400 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl ${color.badge} shrink-0 mt-0.5`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {evt.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${color.badge}`}>
                            {evt.category}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {evt.date}
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            {evt.start_time} – {evt.end_time}
                          </span>
                          {evt.location && (
                            <>
                              <span>•</span>
                              <span>{evt.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 self-start sm:self-auto shrink-0">
                      Open Details →
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EVENT DETAILS MODAL                                      */}
      {/* ======================================================== */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    CATEGORY_COLORS[selectedEventModal.category]?.badge || 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {selectedEventModal.category}
                </span>
                <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
                  {selectedEventModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Date
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedEventModal.date}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Schedule
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedEventModal.start_time} – {selectedEventModal.end_time}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Location / Venue
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedEventModal.location || 'Campus Center'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Target Audience
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedEventModal.target_audience || 'ALL'}
                </span>
              </div>

              {selectedEventModal.organizer && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Organizer / Faculty
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedEventModal.organizer}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedEventModal.description && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedEventModal.description}
                </p>
              </div>
            )}

            {/* Calendar Sync / Export Section */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Sync with External App:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSingleEventIcs(selectedEventModal)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Download .ics file for Apple Calendar, Outlook, or Thunderbird"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Download .ics</span>
                </button>

                <a
                  href={generateGoogleCalendarUrl(selectedEventModal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-indigo-600/20 transition cursor-pointer"
                  title="Open and save directly into Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Calendar</span>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {canManage && !selectedEventModal.id.startsWith('evt-cal-') && !selectedEventModal.id.startsWith('asg-cal-') && !selectedEventModal.id.startsWith('ex-cal-') && !selectedEventModal.id.startsWith('hol-cal-') ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      openEditModal(selectedEventModal);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEventModal.id)}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Integrated collegiate record
                </span>
              )}

              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE / EDIT EVENT MODAL                                */}
      {/* ======================================================== */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black font-display text-slate-900 dark:text-white">
                {isEditModalOpen ? 'Edit Calendar Event' : 'Create New Calendar Event'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Event Name *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AI & Machine Learning Workshop"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Event">🎉 College Event</option>
                    <option value="Class">📚 Class / Lecture</option>
                    <option value="Assignment">📝 Assignment</option>
                    <option value="Exam">🎓 Exam</option>
                    <option value="Competition">🏆 Competition</option>
                    <option value="Announcement">📢 Announcement</option>
                    <option value="Holiday">🏖️ Holiday</option>
                    <option value="Deadline">🔔 Deadline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Auditorium / Lab 2"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Students & Staff</option>
                    <option value="STUDENTS">All Students</option>
                    <option value="TEACHERS">Faculty Members</option>
                    <option value="CSE">CSE Department</option>
                    <option value="IT">IT Department</option>
                    <option value="AI&DS">AI&DS Department</option>
                    <option value="ECE">ECE Department</option>
                    <option value="EEE">EEE Department</option>
                    <option value="Mechanical">Mechanical Department</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Agenda
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key details, speakers, agenda, or guidelines..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
