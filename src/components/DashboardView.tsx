import React, { useMemo } from 'react';
import {
  Users,
  Calendar,
  Award,
  Trophy,
  TrendingUp,
  Sparkles,
  Shield,
  GraduationCap,
  Bell,
  BookOpen,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Building2,
  Layers,
  Flame,
  Clock,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Student,
  CollegeEvent,
  Achievement,
  EventParticipation,
  HouseStats,
  DepartmentStats,
  YearStats,
  Teacher,
  Announcement,
  CalendarEvent,
  TimetableEntry,
  ExamSchedule,
} from '../types';
import { getHouseTheme } from '../utils/houseTheme';

interface DashboardViewProps {
  students: Student[];
  events: CollegeEvent[];
  achievements: Achievement[];
  participations: EventParticipation[];
  houseStats: HouseStats[];
  deptStats: DepartmentStats[];
  yearStats: YearStats[];
  teachers?: Teacher[];
  announcements?: Announcement[];
  timetable?: TimetableEntry[];
  calendarEvents?: CalendarEvent[];
  exams?: ExamSchedule[];
  onNavigate: (tab: any) => void;
  onSelectStudent: (student: Student) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students = [],
  events = [],
  achievements = [],
  participations = [],
  houseStats = [],
  deptStats = [],
  yearStats = [],
  teachers = [],
  announcements = [],
  timetable = [],
  calendarEvents = [],
  exams = [],
  onNavigate = () => {},
  onSelectStudent = () => {},
}) => {
  const safeStudents = students || [];
  const safeEvents = events || [];
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];
  const safeHouseStats = houseStats || [];
  const safeDeptStats = deptStats || [];
  const safeYearStats = yearStats || [];
  const safeTeachers = teachers || [];
  const safeAnnouncements = announcements || [];

  const winningHouse = safeHouseStats[0] || {
    house: 'Red',
    totalPoints: 0,
    achievementPoints: 0,
    participationPoints: 0,
    totalAchievements: 0,
    totalParticipations: 0,
    studentCount: 0,
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Recent 3 events
  const recentEvents = safeEvents.slice(0, 3);
  // Recent 3 announcements
  const recentAnnouncements = safeAnnouncements.slice(0, 3);
  // Recent 4 achievements
  const recentAchievements = safeAchievements.slice(0, 4);

  // Maximum stats for bar scaling
  const maxHousePoints = Math.max(...safeHouseStats.map((h) => h.totalPoints), 1);
  const maxDeptCount = Math.max(...safeDeptStats.map((d) => d.studentCount), 1);
  const maxYearCount = Math.max(...safeYearStats.map((y) => y.studentCount), 1);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>Institutional Executive Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              {greeting}, Administrator 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Here's what's happening across your college today. Track admissions, faculty loads, inter-house standings, event schedules, and accredited awards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('reports')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-300" />
              <span>Institutional Reports</span>
            </button>
            <button
              onClick={() => onNavigate('gradebook')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Academics & Marks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Students
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {safeStudents.length}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              9 Departments
            </span>
            <span className="text-slate-400">Enrolled active</span>
          </div>
        </div>

        {/* Total Teachers */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Teachers
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {safeTeachers.length || 10}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Faculty Verified
            </span>
            <span className="text-slate-400">Assigned</span>
          </div>
        </div>

        {/* Total Events */}
        <div
          onClick={() => onNavigate('events')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Events
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {safeEvents.length}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              {safeParticipations.length} Entries
            </span>
            <span className="text-slate-400">Active roster</span>
          </div>
        </div>

        {/* Total Achievements */}
        <div
          onClick={() => onNavigate('achievements')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Achievements
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {safeAchievements.length}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Trophy className="w-3.5 h-3.5" />
              National & State
            </span>
            <span className="text-slate-400">Honors logged</span>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Upcoming Deadlines Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                📅 Today's Campus Schedule
              </h2>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Full Timetable
            </button>
          </div>

          <div className="space-y-3">
            {timetable.slice(0, 3).map((slot, idx) => (
              <div
                key={slot.id || idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {slot.subject_name}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                        Current Class
                      </span>
                    )}
                    {idx === 1 && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                        Next Class
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {slot.year} {slot.department} {slot.section} • {slot.teacher_name} • Room: {slot.room}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs shrink-0">
                  {slot.start_time} - {slot.end_time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines & Exams */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                ⏰ Upcoming Deadlines & Exams
              </h2>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Smart Calendar
            </button>
          </div>

          <div className="space-y-3">
            {exams.slice(0, 2).map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-900 dark:text-rose-200">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{ex.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ex.subject_name} • {ex.year} {ex.department} • Room: {ex.room}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-xs shrink-0">
                  {ex.date}
                </span>
              </div>
            ))}

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Capstone Synopsis Submission Deadline</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  All 4th Year CSE batches • Online Portal
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs shrink-0">
                In 3 Days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Analytics Section (Department, Year, House) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Analytics */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Department Analytics
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {safeDeptStats.length} Branches
            </span>
          </div>

          <div className="space-y-3">
            {safeDeptStats.map((dept) => {
              const pct = Math.round((dept.studentCount / maxDeptCount) * 100);
              return (
                <div key={dept.department} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {dept.department}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono font-semibold">
                      {dept.studentCount} students
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Year Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Year Distribution
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Cohorts</span>
          </div>

          <div className="space-y-3">
            {safeYearStats.map((yr) => {
              const pct = Math.round((yr.studentCount / maxYearCount) * 100);
              return (
                <div key={yr.year} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {yr.year}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono font-semibold">
                      {yr.studentCount} students ({yr.achievementCount} honors)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* House Distribution & Leaderboard */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                House Distribution
              </h2>
            </div>
            <button
              onClick={() => onNavigate('houses')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Full Board
            </button>
          </div>

          <div className="space-y-3">
            {safeHouseStats.map((h, idx) => {
              const theme = getHouseTheme(h.house);
              const pct = Math.round((h.totalPoints / maxHousePoints) * 100);
              const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️';

              return (
                <div key={h.house} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{rankIcon}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {h.house} House
                      </span>
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {h.totalPoints} pts
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${theme.dotColor} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tri-Column: Recent Events, Recent Announcements, Recent Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Recent Events
              </h2>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentEvents.map((e) => (
              <div
                key={e.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {e.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {e.date} • {e.venue || 'Campus'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {e.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Recent Announcements
              </h2>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Circulars
            </button>
          </div>

          <div className="space-y-3">
            {recentAnnouncements.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {a.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                    {a.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Recent Achievements
              </h2>
            </div>
            <button
              onClick={() => onNavigate('achievements')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              All Honors
            </button>
          </div>

          <div className="space-y-3">
            {recentAchievements.map((ach) => (
              <div
                key={ach.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {ach.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ach.level} Level • {ach.student_id}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0">
                  {ach.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* House Ranking Podium Bottom Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-indigo-800/60 text-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-black font-display tracking-tight text-white">
                House Championship Podium
              </h2>
              <p className="text-xs text-slate-300">
                Current rankings calculated in real-time from verified student awards and participation points.
              </p>
            </div>
          </div>

          <button
            onClick={triggerCelebration}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebrate Winner</span>
          </button>
        </div>

        {/* Podium Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {safeHouseStats.slice(0, 4).map((h, idx) => {
            const medal = idx === 0 ? '🥇 1st Place' : idx === 1 ? '🥈 2nd Place' : idx === 2 ? '🥉 3rd Place' : '🎖️ 4th Place';
            const theme = getHouseTheme(h.house);
            const isWinner = idx === 0;

            return (
              <div
                key={h.house}
                className={`p-5 rounded-2xl border transition-all ${
                  isWinner
                    ? 'bg-amber-500/15 border-amber-400/50 shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${isWinner ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white'}`}>
                    {medal}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {h.studentCount} members
                  </span>
                </div>
                <div className="text-2xl font-black font-display text-white">
                  {h.house} House
                </div>
                <div className="text-sm font-bold text-amber-300 mt-1">
                  {h.totalPoints} Total Points
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-white/10">
                  <span>Honors: {h.achievementCount}</span>
                  <span>Part: {h.participationCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
