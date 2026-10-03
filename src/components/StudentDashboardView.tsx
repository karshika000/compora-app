import React, { useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Flame,
  Shield,
  Star,
  Award,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  User,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  Student,
  CollegeEvent,
  Achievement,
  EventParticipation,
  HouseColor,
  StudentResult,
  Assignment,
  AssignmentSubmission,
  HouseStats,
  Announcement,
} from '../types';
import { POINT_SYSTEM } from '../data/initialData';
import { getHouseTheme } from '../utils/houseTheme';

interface StudentDashboardViewProps {
  student: Student;
  events?: CollegeEvent[];
  achievements?: Achievement[];
  participations?: EventParticipation[];
  results?: StudentResult[];
  assignments?: Assignment[];
  submissions?: AssignmentSubmission[];
  houseStats?: HouseStats[];
  announcements?: Announcement[];
  onNavigateTab: (tab: any) => void;
}

const GRADE_POINTS: Record<string, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  RA: 0,
  U: 0,
};

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  events = [],
  achievements = [],
  participations = [],
  results = [],
  assignments = [],
  submissions = [],
  houseStats = [],
  announcements = [],
  onNavigateTab = () => {},
}) => {
  const safeEvents = events || [];
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];
  const safeResults = results || [];
  const safeAssignments = assignments || [];
  const safeSubmissions = submissions || [];
  const safeHouseStats = houseStats || [];

  // Filter student-specific data
  const myParticipations = useMemo(() => {
    return safeParticipations.filter(
      (p) => p.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
    );
  }, [safeParticipations, student]);

  const myAchievements = useMemo(() => {
    return safeAchievements.filter(
      (a) => a.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
    );
  }, [safeAchievements, student]);

  const myResults = useMemo(() => {
    return safeResults.filter(
      (r) => r.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
    );
  }, [safeResults, student]);

  // Registered Events
  const myEvents = useMemo(() => {
    const eventIds = new Set(myParticipations.map((p) => p.event_id));
    return safeEvents.filter((e) => eventIds.has(e.id));
  }, [safeEvents, myParticipations]);

  const upcomingEvents = useMemo(() => {
    return safeEvents
      .filter((e) => e.status === 'Upcoming' || !e.status)
      .slice(0, 3);
  }, [safeEvents]);

  // Total Points Earned by student
  const totalMyPoints = useMemo(() => {
    const achPts = myAchievements.reduce((sum, a) => {
      return sum + (POINT_SYSTEM.achievements[a.level] || 10);
    }, 0);
    const partPts = myParticipations.length * 5;
    return achPts + partPts;
  }, [myAchievements, myParticipations]);

  // Compute student CGPA from actual results
  const studentCGPA = useMemo(() => {
    const published = myResults.filter((r) => r.is_published && r.grade && r.grade !== 'Pending');
    if (published.length === 0) return '8.75';
    let totalCredits = 0;
    let totalWeightedPoints = 0;
    published.forEach((r) => {
      const creds = r.credits || 4;
      const gp = GRADE_POINTS[r.grade] !== undefined ? GRADE_POINTS[r.grade] : 8;
      totalCredits += creds;
      totalWeightedPoints += creds * gp;
    });
    if (totalCredits === 0) return '8.75';
    return (totalWeightedPoints / totalCredits).toFixed(2);
  }, [myResults]);

  // House information
  const myHouseStats = safeHouseStats.find((h) => h.house === student?.house);
  const winningHouse = safeHouseStats[0] || { house: 'Red', totalPoints: 0 };
  const houseRank = safeHouseStats.findIndex((h) => h.house === student?.house) + 1 || 1;

  // Student class string
  const studentClass = `${student.year} ${student.department} ${student.section}`;

  // Student assignments & submissions
  const relevantAssignments = useMemo(() => {
    return safeAssignments
      .filter((a) => !a.class_name || a.class_name.includes(student.department) || a.class_name === studentClass)
      .slice(0, 4);
  }, [safeAssignments, student, studentClass]);

  const getSubmissionStatus = (assignmentId: string) => {
    const sub = safeSubmissions.find(
      (s) => s.assignment_id === assignmentId && s.student_id.toLowerCase() === student.student_id.toLowerCase()
    );
    if (!sub) return { status: 'Not Submitted', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
    if (sub.status === 'Graded') return { status: `Graded (${sub.marks}/100)`, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    return { status: 'Submitted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
  };

  const houseThemes: Record<HouseColor, { bg: string; border: string; text: string; lightBg: string; pill: string }> = {
    Red: {
      bg: 'from-rose-600 via-red-600 to-rose-700',
      border: 'border-rose-300 dark:border-rose-800',
      text: 'text-rose-600 dark:text-rose-400',
      lightBg: 'bg-rose-50 dark:bg-rose-950/40',
      pill: 'bg-rose-500',
    },
    Blue: {
      bg: 'from-blue-600 via-indigo-600 to-blue-700',
      border: 'border-blue-300 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      lightBg: 'bg-blue-50 dark:bg-blue-950/40',
      pill: 'bg-blue-500',
    },
    Green: {
      bg: 'from-emerald-600 via-teal-600 to-emerald-700',
      border: 'border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      pill: 'bg-emerald-500',
    },
    Yellow: {
      bg: 'from-amber-500 via-yellow-500 to-amber-600',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      lightBg: 'bg-amber-50 dark:bg-amber-950/40',
      pill: 'bg-amber-500',
    },
  };

  const houseTheme = houseThemes[student?.house as HouseColor] || houseThemes.Red;

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div id="student-dashboard-view" className="space-y-6">
      {/* Student Welcome Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${houseTheme.bg} text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 translate-y-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/25">
              <Shield className="w-3.5 h-3.5" />
              <span>{student.house} House • Reg #{student.student_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              {greeting}, {student.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
              Here's your academic overview. Department of {student.department} • {student.year} • Section {student.section}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('student_results')}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Internal Marks & Results</span>
            </button>
            <button
              onClick={() => onNavigateTab('student_assignments')}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 text-xs font-bold shadow-lg hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>My Assignments</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Cumulative CGPA */}
        <div
          onClick={() => onNavigateTab('student_results')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CGPA
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {studentCGPA} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">
            <span>First Class Honors</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Current Semester */}
        <div
          onClick={() => onNavigateTab('student_profile')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Semester
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {student.year}
          </div>
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-2">
            <span>{student.department} • Section {student.section}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* My House */}
        <div
          onClick={() => onNavigateTab('houses')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              My House
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {student.house} <span className="text-xs text-slate-400 font-normal">House</span>
          </div>
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold mt-2">
            <span>Rank #{houseRank} • {totalMyPoints} pts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Upcoming Events */}
        <div
          onClick={() => onNavigateTab('events')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upcoming Events
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {myEvents.length}
          </div>
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold mt-2">
            <span>{upcomingEvents.length} Campus Events</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* Two-Column Section: Academic Performance & Upcoming Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Performance Chart / Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Academic Performance
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('student_results')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Full Results
            </button>
          </div>

          <div className="space-y-3">
            {myResults.length > 0 ? (
              myResults.slice(0, 4).map((r) => {
                const total = (r.internal_total || 0) + (r.external_mark || 0);
                const pct = Math.min(100, Math.round((total / 100) * 100));
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.subject_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Internal: {r.internal_total}/50 • External: {r.external_mark || 0}/50
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        {total}/100 ({r.grade || 'A'})
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
                Course marks are currently in compilation. Check back after CIA 1 assessment.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Upcoming Assignments
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('student_assignments')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Submit Work
            </button>
          </div>

          <div className="space-y-3">
            {relevantAssignments.length > 0 ? (
              relevantAssignments.map((a) => {
                const subStatus = getSubmissionStatus(a.id);
                return (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {a.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{a.subject_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Due: {a.due_date}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl font-bold text-[11px] ${subStatus.color}`}>
                      {subStatus.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
                📚 You're all caught up on assignments!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Upcoming Events & Recent Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Upcoming Events
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Explore All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {evt.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{evt.date}</span>
                    <span>•</span>
                    <span>{evt.venue || 'Auditorium'}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                  {evt.category}
                </span>
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
              onClick={() => onNavigateTab('student_achievements')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              My Awards
            </button>
          </div>

          <div className="space-y-3">
            {myAchievements.length > 0 ? (
              myAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {ach.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {ach.level} Level • {ach.category}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                    +{POINT_SYSTEM.achievements[ach.level] || 10} pts
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
                No individual honors logged yet. Participate in campus hackathons to earn points!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MY HOUSE Dedicated Visual Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/50 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-2xl">
              🏠
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                Inter-House Championship
              </div>
              <h2 className="text-xl font-black font-display tracking-tight text-white">
                MY HOUSE: {student.house} House
              </h2>
            </div>
          </div>

          {/* Overall Winning House Banner */}
          <div className="px-4 py-2 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-300 flex items-center gap-2 text-xs font-black self-start sm:self-auto">
            <span>🏆 Overall Winning House:</span>
            <span className="text-white font-bold">{winningHouse.house} ({winningHouse.totalPoints} pts)</span>
          </div>
        </div>

        {/* House Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Points
            </div>
            <div className="text-2xl font-black font-display text-white mt-1">
              {myHouseStats?.totalPoints || totalMyPoints}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Championship Rank
            </div>
            <div className="text-2xl font-black font-display text-amber-400 mt-1">
              #{houseRank} of 4
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              House Members
            </div>
            <div className="text-2xl font-black font-display text-white mt-1">
              {myHouseStats?.studentCount || 12}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Achievements
            </div>
            <div className="text-2xl font-black font-display text-white mt-1">
              {myHouseStats?.achievementCount || myAchievements.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
