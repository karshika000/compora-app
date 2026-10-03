import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Award,
  Shield,
  BarChart3,
  Sparkles,
  Settings,
  X,
  GraduationCap,
  UserCheck,
  Trophy,
  User,
  CheckCircle2,
  FileText,
  BookOpen,
  FileSpreadsheet,
  Layers,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ComporaLogo } from './ComporaLogo';

export type NavTab =
  | 'dashboard'
  | 'calendar'
  | 'timetable'
  | 'students'
  | 'teachers'
  | 'academic_structure'
  | 'gradebook'
  | 'assignments'
  | 'events'
  | 'achievements'
  | 'houses'
  | 'reports'
  | 'announcements'
  | 'ai'
  | 'users'
  | 'settings'
  | 'student_profile'
  | 'student_participation'
  | 'student_achievements'
  | 'student_results'
  | 'student_assignments';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: {
    students: number;
    events: number;
    achievements: number;
    users?: number;
    teachers?: number;
    assignments?: number;
    calendar?: number;
  };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  counts,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentUser, logout, linkedStudent } = useAuth();
  const role: UserRole = currentUser?.role || 'STUDENT';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleTheme = {
    ADMIN: {
      bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
      label: 'Administrator',
    },
    TEACHER: {
      bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      label: 'Teacher / Faculty',
    },
    STUDENT: {
      bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
      label: 'Student',
    },
  }[role];

  // Helper for Nav Item
  const renderNavItem = (
    tab: NavTab,
    label: string,
    Icon: React.ElementType,
    badge?: number | string,
    customColor?: string
  ) => {
    const isActive = activeTab === tab;

    return (
      <button
        key={tab}
        onClick={() => handleSelect(tab)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center ${
          isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
        } rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-indigo-600 text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-white' : customColor || 'text-slate-500 dark:text-slate-400'
            }`}
          />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </div>

        {!isCollapsed && badge !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 md:top-20 h-[calc(100vh)] md:h-[calc(100vh-6rem)] z-50 md:z-10 bg-white dark:bg-slate-900 border-r md:border border-slate-200 dark:border-slate-800 md:rounded-3xl flex flex-col justify-between shrink-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72 md:w-64'
        } ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top Header & Navigation Links */}
        <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 md:hidden">
            <ComporaLogo variant="full" size="sm" showTagline={false} />
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Collapse Toggle Header */}
          <div className="hidden md:flex items-center justify-between px-1">
            {!isCollapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Navigation
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Role Indicator Banner */}
          {!isCollapsed ? (
            <div
              className={`px-3 py-2 rounded-2xl border flex items-center justify-between text-xs ${roleTheme.bg}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${roleTheme.dot}`} />
                <span className="font-bold truncate">{roleTheme.label}</span>
              </div>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {role}
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title={`${roleTheme.label} (${role})`}>
              <span className={`w-2.5 h-2.5 rounded-full ${roleTheme.dot}`} />
            </div>
          )}

          {/* Navigation Items based on Role */}
          <nav className="space-y-1">
            {role === 'STUDENT' ? (
              /* STUDENT MENU */
              <>
                {renderNavItem('dashboard', 'Dashboard', LayoutDashboard)}
                {renderNavItem('calendar', 'Calendar', Calendar, counts.calendar, 'text-indigo-500')}
                {renderNavItem('timetable', 'My Timetable', Clock, undefined, 'text-blue-500')}
                {renderNavItem('student_profile', 'My Profile & House', User)}
                {renderNavItem(
                  'student_results',
                  'Academic Results',
                  FileSpreadsheet,
                  undefined,
                  'text-emerald-500'
                )}
                {renderNavItem(
                  'student_assignments',
                  'Assignments',
                  FileText,
                  undefined,
                  'text-amber-500'
                )}
                {renderNavItem('events', 'Events', Calendar, counts.events)}
                {renderNavItem('student_participation', 'Participations', CheckCircle2)}
                {renderNavItem(
                  'student_achievements',
                  'Achievements',
                  Trophy,
                  undefined,
                  'text-yellow-500'
                )}
                {renderNavItem('houses', 'House Rankings', Shield)}
                {renderNavItem('announcements', 'Announcements', Bell)}
                {renderNavItem('settings', 'Settings', Settings)}
              </>
            ) : role === 'TEACHER' ? (
              /* TEACHER MENU */
              <>
                {renderNavItem('dashboard', 'Dashboard', LayoutDashboard)}
                {renderNavItem('calendar', 'Calendar', Calendar, counts.calendar, 'text-indigo-500')}
                {renderNavItem('timetable', 'Teaching Timetable', Clock, undefined, 'text-blue-500')}
                {renderNavItem('students', 'Students', Users, counts.students)}
                {renderNavItem(
                  'gradebook',
                  'Academics & Marks',
                  FileSpreadsheet,
                  undefined,
                  'text-amber-500'
                )}
                {renderNavItem(
                  'assignments',
                  'Assignments',
                  FileText,
                  undefined,
                  'text-indigo-500'
                )}
                {renderNavItem('events', 'Events', Calendar, counts.events)}
                {renderNavItem('achievements', 'Achievements', Award, counts.achievements)}
                {renderNavItem('houses', 'House Rankings', Shield)}
                {renderNavItem('announcements', 'Announcements', Bell)}
                {renderNavItem(
                  'ai',
                  'AI Insights',
                  Sparkles,
                  'AI',
                  'text-purple-600 dark:text-purple-400'
                )}
                {renderNavItem('settings', 'Settings', Settings)}
              </>
            ) : (
              /* ADMIN MENU */
              <>
                {renderNavItem('dashboard', 'Dashboard', LayoutDashboard)}
                {renderNavItem('calendar', 'Calendar', Calendar, counts.calendar, 'text-indigo-500')}
                {renderNavItem('timetable', 'Timetable Manager', Clock, undefined, 'text-blue-500')}
                {renderNavItem('students', 'Students', Users, counts.students)}
                {renderNavItem(
                  'teachers',
                  'Teachers / Staff',
                  GraduationCap,
                  counts.teachers,
                  'text-amber-500'
                )}
                {renderNavItem(
                  'academic_structure',
                  'Academic Structure',
                  Layers,
                  undefined,
                  'text-blue-500'
                )}
                {renderNavItem(
                  'gradebook',
                  'Academics & Marks',
                  FileSpreadsheet,
                  undefined,
                  'text-emerald-500'
                )}
                {renderNavItem(
                  'assignments',
                  'Assignments',
                  FileText,
                  undefined,
                  'text-indigo-500'
                )}
                {renderNavItem('events', 'Events', Calendar, counts.events)}
                {renderNavItem('achievements', 'Achievements', Award, counts.achievements)}
                {renderNavItem('houses', 'House Rankings', Shield)}
                {renderNavItem('announcements', 'Announcements', Bell)}
                {renderNavItem('reports', 'Reports', BarChart3)}
                {renderNavItem(
                  'ai',
                  'AI Intelligence',
                  Sparkles,
                  'AI',
                  'text-purple-600 dark:text-purple-400'
                )}
                {renderNavItem('users', 'User Accounts', UserCheck)}
                {renderNavItem('settings', 'Settings', Settings)}
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer: User profile, Role, Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 md:rounded-b-3xl">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser?.name || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {role === 'STUDENT'
                      ? `${linkedStudent?.house || ''} House • Student`
                      : role === 'TEACHER'
                      ? 'Faculty Member'
                      : 'Campus Administrator'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                title={currentUser?.name || 'User'}
              >
                {initials}
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
