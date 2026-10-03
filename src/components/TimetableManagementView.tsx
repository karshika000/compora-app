import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  Building2,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  TimetableEntry,
  WeekdayName,
  DepartmentName,
  AcademicYear,
  Teacher,
  Subject,
  AcademicClass,
  Student,
  UserRole,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { downloadIcsFile, generateTimetableIcs } from '../utils/icsExport';

interface TimetableManagementViewProps {
  entries: TimetableEntry[];
  teachers?: Teacher[];
  subjects?: Subject[];
  classes?: AcademicClass[];
  students?: Student[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

const WEEKDAYS: WeekdayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEPARTMENTS: DepartmentName[] = [
  'CSE',
  'IT',
  'AI&DS',
  'CSBS',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
  'BME',
];

const YEARS: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const TimetableManagementView: React.FC<TimetableManagementViewProps> = ({
  entries = [],
  teachers = [],
  subjects = [],
  classes = [],
  students = [],
  onRefresh = () => {},
  onAddToast,
}) => {
  const { currentUser, authFetch, linkedStudent } = useAuth();
  const role: UserRole = currentUser?.role || 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  // Active selected day for compact tabs
  const [selectedDayTab, setSelectedDayTab] = useState<WeekdayName | 'All'>('All');

  // Filter State for Admin
  const [filterDept, setFilterDept] = useState<string>(
    isStudent ? linkedStudent?.department || 'CSE' : 'CSE'
  );
  const [filterYear, setFilterYear] = useState<string>(
    isStudent ? linkedStudent?.year || '1st Year' : '1st Year'
  );
  const [filterSection, setFilterSection] = useState<string>(
    isStudent ? linkedStudent?.section || 'Section A' : 'Section A'
  );

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    day: 'Monday' as WeekdayName,
    start_time: '09:00',
    end_time: '10:00',
    department: 'CSE' as DepartmentName,
    year: '1st Year' as AcademicYear,
    section: 'Section A',
    subject_name: subjects[0]?.name || 'Problem Solving and C Programming',
    subject_code: subjects[0]?.code || 'CS1101',
    teacher_name: teachers[0]?.name || 'Dr. Arun Kumar',
    teacher_id: teachers[0]?.id || 'STF001',
    room: 'CSE-201',
    semester: 'Semester 1',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtered timetable entries
  const displayedEntries = useMemo(() => {
    let list = [...entries];

    if (isStudent && linkedStudent) {
      // Auto-lock to student cohort
      list = list.filter(
        (t) =>
          t.department === linkedStudent.department &&
          t.year === linkedStudent.year &&
          (t.section === linkedStudent.section || t.section === 'A' || t.section === 'B' || t.section === 'Section A')
      );
    } else if (isTeacher) {
      // Filter to faculty
      list = list.filter(
        (t) =>
          t.teacher_id === currentUser?.id ||
          t.teacher_name.toLowerCase() === currentUser?.name?.toLowerCase()
      );
    } else {
      // Admin filter by selected class
      list = list.filter(
        (t) =>
          (filterDept === 'All' || t.department === filterDept) &&
          (filterYear === 'All' || t.year === filterYear) &&
          (filterSection === 'All' || t.section === filterSection || t.section.includes(filterSection))
      );
    }

    if (selectedDayTab !== 'All') {
      list = list.filter((t) => t.day === selectedDayTab);
    }

    return list;
  }, [entries, isStudent, isTeacher, linkedStudent, currentUser, filterDept, filterYear, filterSection, selectedDayTab]);

  // Group by day
  const entriesByDay = useMemo(() => {
    const map = new Map<WeekdayName, TimetableEntry[]>();
    WEEKDAYS.forEach((d) => map.set(d, []));
    displayedEntries.forEach((e) => {
      const dayList = map.get(e.day) || [];
      dayList.push(e);
      map.set(e.day, dayList);
    });
    // Sort each day's entries by start time
    map.forEach((list) => {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [displayedEntries]);

  // Current live class checker
  const currentStatus = useMemo(() => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[now.getDay()] as WeekdayName;
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`;

    const todaySlots = entriesByDay.get(currentDayName) || [];
    let currentClass: TimetableEntry | null = null;
    let nextClass: TimetableEntry | null = null;

    for (const slot of todaySlots) {
      if (currentTimeStr >= slot.start_time && currentTimeStr < slot.end_time) {
        currentClass = slot;
      } else if (currentTimeStr < slot.start_time && !nextClass) {
        nextClass = slot;
      }
    }

    return { currentDayName, currentClass, nextClass, isClassDay: todaySlots.length > 0 };
  }, [entriesByDay]);

  const handleOpenAdd = () => {
    setFormData({
      day: selectedDayTab !== 'All' ? selectedDayTab : 'Monday',
      start_time: '09:00',
      end_time: '10:00',
      department: (filterDept !== 'All' ? filterDept : 'CSE') as DepartmentName,
      year: (filterYear !== 'All' ? filterYear : '1st Year') as AcademicYear,
      section: filterSection !== 'All' ? filterSection : 'Section A',
      subject_name: subjects[0]?.name || 'Problem Solving and C Programming',
      subject_code: subjects[0]?.code || 'CS1101',
      teacher_name: teachers[0]?.name || 'Dr. Arun Kumar',
      teacher_id: teachers[0]?.id || 'STF001',
      room: 'CSE-201',
      semester: 'Semester 1',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      day: entry.day,
      start_time: entry.start_time,
      end_time: entry.end_time,
      department: entry.department,
      year: entry.year,
      section: entry.section,
      subject_name: entry.subject_name,
      subject_code: entry.subject_code || '',
      teacher_name: entry.teacher_name,
      teacher_id: entry.teacher_id,
      room: entry.room,
      semester: entry.semester || 'Semester 1',
    });
    setFormError('');
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.day || !formData.start_time || !formData.end_time || !formData.subject_name || !formData.teacher_name || !formData.room) {
      setFormError('Please fill in all required timetable fields.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setFormError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const url = editingEntry ? `/api/timetable/${editingEntry.id}` : '/api/timetable';
      const method = editingEntry ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onAddToast(
          editingEntry ? 'Timetable entry updated successfully.' : 'Class slot scheduled in timetable!',
          'success',
          'Timetable Saved'
        );
        setIsAddModalOpen(false);
        setEditingEntry(null);
        onRefresh();
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to save timetable entry.');
      }
    } catch {
      setFormError('Network error saving timetable entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) return;

    try {
      const res = await authFetch(`/api/timetable/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onAddToast('Timetable slot deleted.', 'info');
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to delete entry.', 'error');
      }
    } catch {
      onAddToast('Network error deleting timetable slot.', 'error');
    }
  };

  // iCalendar (.ics) Timetable Export Handler
  const handleExportTimetableIcs = () => {
    if (displayedEntries.length === 0) {
      onAddToast('No timetable classes available to export.', 'warning', 'Empty Timetable');
      return;
    }

    let title = 'COMPORA - Academic Timetable';
    let filename = 'compora_timetable_schedule.ics';

    if (isStudent && linkedStudent) {
      title = `${linkedStudent.year} ${linkedStudent.department} ${linkedStudent.section} Timetable`;
      filename = `timetable_${linkedStudent.department}_${linkedStudent.section}.ics`;
    } else if (isTeacher && currentUser) {
      title = `Faculty Schedule - ${currentUser.name}`;
      filename = `faculty_timetable_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}.ics`;
    } else if (isAdmin) {
      title = `${filterYear} ${filterDept} ${filterSection} Timetable`;
      filename = `timetable_${filterDept}_${filterSection}.ics`;
    }

    const icsContent = generateTimetableIcs(displayedEntries, title);
    downloadIcsFile(filename, icsContent);
    onAddToast(
      `Exported ${displayedEntries.length} weekly recurring classes to ${filename}. Ready to sync with Google Calendar or Apple Calendar!`,
      'success',
      'Timetable iCalendar Exported'
    );
  };

  return (
    <div id="timetable-view" className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md text-blue-300 text-xs font-bold border border-blue-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isStudent
                  ? `My Official Timetable • ${linkedStudent?.year} ${linkedStudent?.department} ${linkedStudent?.section}`
                  : isTeacher
                  ? `Faculty Teaching Schedule • ${currentUser?.name}`
                  : 'College Master Academic Timetable'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Academic Timetable & Lecture Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isStudent
                ? 'Your weekly coursework timetable. Automatically synchronized with classroom numbers and faculty assignments.'
                : isTeacher
                ? 'Your assigned lectures, laboratory sessions, and classroom allocations for the academic term.'
                : 'Configure departmental lecture timetables with automatic conflict detection across faculty, classrooms, and student cohorts.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            {/* Export Timetable to iCal */}
            <button
              onClick={handleExportTimetableIcs}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition flex items-center gap-2 cursor-pointer shadow-xs"
              title="Download weekly repeating timetable to sync with Google Calendar or Apple Calendar"
            >
              <Download className="w-4 h-4 text-blue-300" />
              <span>Export Timetable (.ics)</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Class Slot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Status Widget: Current & Next Class */}
      {(isStudent || isTeacher) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                🟢 Live Now
              </span>
              <div className="text-base font-black text-slate-900 dark:text-white font-display">
                {currentStatus.currentClass ? currentStatus.currentClass.subject_name : 'No Class in Session'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentStatus.currentClass
                  ? `Room ${currentStatus.currentClass.room} • ${currentStatus.currentClass.start_time} - ${currentStatus.currentClass.end_time}`
                  : 'Enjoy your free period or study break!'}
              </p>
            </div>
            {currentStatus.currentClass && (
              <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0">
                In Progress
              </span>
            )}
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                ⏰ Next Lecture
              </span>
              <div className="text-base font-black text-slate-900 dark:text-white font-display">
                {currentStatus.nextClass ? currentStatus.nextClass.subject_name : 'All Classes Completed Today'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentStatus.nextClass
                  ? `Room ${currentStatus.nextClass.room} • Starts at ${currentStatus.nextClass.start_time}`
                  : 'You have completed all scheduled classes for today.'}
              </p>
            </div>
            {currentStatus.nextClass && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0">
                {currentStatus.nextClass.start_time}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Admin Class Selector & Day Filter Tabs */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Admin Class Selectors */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Department
              </label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d} Department
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Academic Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Section
              </label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
              </select>
            </div>
          </div>
        )}

        {/* Day Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDayTab('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedDayTab === 'All'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Full Week (Mon–Sat)
          </button>
          {WEEKDAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayTab(day)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedDayTab === day
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weekly Timetable Grid */}
      <div className="space-y-6">
        {WEEKDAYS.filter((d) => selectedDayTab === 'All' || selectedDayTab === d).map((day) => {
          const slots = entriesByDay.get(day) || [];

          return (
            <div
              key={day}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {day.slice(0, 2)}
                  </div>
                  <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
                    {day}
                  </h2>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {slots.length} Classes Scheduled
                </span>
              </div>

              {/* Day Slots List / Cards */}
              {slots.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  No classes scheduled for {day}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 hover:border-indigo-400 transition flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {slot.start_time} – {slot.end_time}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {slot.subject_code}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                          {slot.subject_name}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-amber-500" />
                            <span className="truncate">{slot.teacher_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            <span>Room: {slot.room}</span>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            onClick={() => handleOpenEdit(slot)}
                            className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* CREATE / EDIT TIMETABLE MODAL (WITH CONFLICT CHECK)      */}
      {/* ======================================================== */}
      {(isAddModalOpen || editingEntry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black font-display text-slate-900 dark:text-white">
                {editingEntry ? 'Edit Class Slot' : 'Add Timetable Slot'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEntry(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Day *
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as WeekdayName })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentName })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Year *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value as AcademicYear })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section *
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Teacher *
                  </label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => {
                      const t = teachers.find((tch) => tch.id === e.target.value);
                      setFormData({
                        ...formData,
                        teacher_id: e.target.value,
                        teacher_name: t?.name || 'Dr. Arun Kumar',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Lab *
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. CSE-204 / Turing Lab 1"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEntry(null);
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
                  {submitting ? 'Saving...' : editingEntry ? 'Save Changes' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
