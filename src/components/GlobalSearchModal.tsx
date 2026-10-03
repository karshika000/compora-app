import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  Calendar,
  Bell,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Shield,
  FileText,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  CollegeEvent,
  Announcement,
  Teacher,
  Assignment,
  UserRole,
} from '../types';
import { getHouseTheme } from '../utils/houseTheme';

export type SearchCategoryFilter = 'ALL' | 'STUDENTS' | 'EVENTS' | 'ANNOUNCEMENTS' | 'ACADEMICS';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  events: CollegeEvent[];
  announcements: Announcement[];
  teachers?: Teacher[];
  assignments?: Assignment[];
  onSelectStudent: (student: Student) => void;
  onNavigateTab: (tab: any) => void;
  userRole?: UserRole;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  students = [],
  events = [],
  announcements = [],
  teachers = [],
  assignments = [],
  onSelectStudent,
  onNavigateTab,
  userRole = 'STUDENT',
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveCategory('ALL');
    }
  }, [isOpen]);

  // Global keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const trimmed = query.trim().toLowerCase();

  // Matched Students
  const matchedStudents = useMemo(() => {
    if (!trimmed) return [];
    if (activeCategory !== 'ALL' && activeCategory !== 'STUDENTS') return [];
    return students
      .filter((s) => {
        return (
          s.name.toLowerCase().includes(trimmed) ||
          s.student_id.toLowerCase().includes(trimmed) ||
          s.department.toLowerCase().includes(trimmed) ||
          s.house.toLowerCase().includes(trimmed) ||
          (s.email && s.email.toLowerCase().includes(trimmed))
        );
      })
      .slice(0, 5);
  }, [students, trimmed, activeCategory]);

  // Matched Events
  const matchedEvents = useMemo(() => {
    if (!trimmed) return [];
    if (activeCategory !== 'ALL' && activeCategory !== 'EVENTS') return [];
    return events
      .filter((e) => {
        return (
          e.name.toLowerCase().includes(trimmed) ||
          e.description.toLowerCase().includes(trimmed) ||
          e.department.toLowerCase().includes(trimmed) ||
          (e.category && e.category.toLowerCase().includes(trimmed)) ||
          (e.venue && e.venue.toLowerCase().includes(trimmed))
        );
      })
      .slice(0, 5);
  }, [events, trimmed, activeCategory]);

  // Matched Announcements
  const matchedAnnouncements = useMemo(() => {
    if (!trimmed) return [];
    if (activeCategory !== 'ALL' && activeCategory !== 'ANNOUNCEMENTS') return [];
    return announcements
      .filter((a) => {
        return (
          a.title.toLowerCase().includes(trimmed) ||
          a.content.toLowerCase().includes(trimmed) ||
          a.category.toLowerCase().includes(trimmed) ||
          (a.author_name && a.author_name.toLowerCase().includes(trimmed))
        );
      })
      .slice(0, 4);
  }, [announcements, trimmed, activeCategory]);

  // Matched Assignments / Coursework
  const matchedAssignments = useMemo(() => {
    if (!trimmed) return [];
    if (activeCategory !== 'ALL' && activeCategory !== 'ACADEMICS') return [];
    return assignments
      .filter((asg) => {
        return (
          asg.title.toLowerCase().includes(trimmed) ||
          asg.subject_name.toLowerCase().includes(trimmed) ||
          asg.class_name.toLowerCase().includes(trimmed) ||
          asg.description.toLowerCase().includes(trimmed)
        );
      })
      .slice(0, 4);
  }, [assignments, trimmed, activeCategory]);

  const totalResults =
    matchedStudents.length +
    matchedEvents.length +
    matchedAnnouncements.length +
    matchedAssignments.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, roll numbers, college events, notices, or assignments..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All Results
          </button>

          <button
            onClick={() => setActiveCategory('STUDENTS')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'STUDENTS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('EVENTS')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'EVENTS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('ANNOUNCEMENTS')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'ANNOUNCEMENTS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notices ({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('ACADEMICS')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'ACADEMICS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Assignments</span>
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {/* If No Query: Suggest Popular Searches */}
          {!trimmed ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Search COMPORA Ledger
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Type student name, roll number (e.g. 24CSE101), event name, symposium, or campus announcement.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-slate-400 self-center">Try:</span>
                {['Hackathon', 'CSE', 'Red House', 'Blue House', 'Symposium', 'Exam'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            /* No Results Found */
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No matching records found for "{query}"
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Try searching by roll number, department, house name, or partial keyword.
              </p>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-5">
              {/* STUDENTS GROUP */}
              {matchedStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Students ({matchedStudents.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('students');
                        onClose();
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline capitalize"
                    >
                      View Directory →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {matchedStudents.map((st) => {
                      const theme = getHouseTheme(st.house);
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            onSelectStudent(st);
                            onClose();
                          }}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {st.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {st.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="font-mono">{st.student_id}</span>
                                <span>•</span>
                                <span>{st.department} {st.year}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                              {st.house}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EVENTS GROUP */}
              {matchedEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>College & External Events ({matchedEvents.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('events');
                        onClose();
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline capitalize"
                    >
                      View Schedule →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {matchedEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          onNavigateTab('events');
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                evt.status === 'Completed'
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {evt.status || 'Upcoming'}
                            </span>
                            <span className="text-[10px] text-slate-400">{evt.date}</span>
                          </div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {evt.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {evt.department} • {evt.venue || 'Campus'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                            {evt.category || 'Event'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANNOUNCEMENTS GROUP */}
              {matchedAnnouncements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>Notices & Announcements ({matchedAnnouncements.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('announcements');
                        onClose();
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:underline capitalize"
                    >
                      View Noticeboard →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {matchedAnnouncements.map((ann) => (
                      <div
                        key={ann.id}
                        onClick={() => {
                          onNavigateTab('announcements');
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              {ann.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{ann.created_at}</span>
                          </div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                            {ann.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {ann.content}
                          </div>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ASSIGNMENTS GROUP */}
              {matchedAssignments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Assignments & Coursework ({matchedAssignments.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab(userRole === 'STUDENT' ? 'student_assignments' : 'assignments');
                        onClose();
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline capitalize"
                    >
                      View Assignments →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {matchedAssignments.map((asg) => (
                      <div
                        key={asg.id}
                        onClick={() => {
                          onNavigateTab(userRole === 'STUDENT' ? 'student_assignments' : 'assignments');
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {asg.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {asg.subject_name} • {asg.class_name} • Due: {asg.due_date}
                          </div>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with quick shortcuts */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px]">
                ESC
              </kbd>
              <span>to close</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px]">
                ⌘K
              </kbd>
              <span>to toggle</span>
            </span>
          </div>

          <div className="font-medium text-slate-400">
            COMPORA Global Index
          </div>
        </div>
      </div>
    </div>
  );
};
