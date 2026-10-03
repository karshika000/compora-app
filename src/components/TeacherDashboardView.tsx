import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  FileCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  Search,
  Award,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  Teacher,
  Student,
  Assignment,
  AssignmentSubmission,
  StudentResult,
  CollegeEvent,
} from '../types';
import { useAuth } from '../context/AuthContext';

interface TeacherDashboardViewProps {
  teacher: Teacher | null;
  students?: Student[];
  assignments?: Assignment[];
  submissions?: AssignmentSubmission[];
  results?: StudentResult[];
  events?: CollegeEvent[];
  onNavigateTab: (tab: any) => void;
  onSelectStudent: (student: Student) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacher,
  students = [],
  assignments = [],
  submissions = [],
  results = [],
  events = [],
  onNavigateTab = () => {},
  onSelectStudent = () => {},
}) => {
  const safeStudents = students || [];
  const safeAssignments = assignments || [];
  const safeSubmissions = submissions || [];
  const safeResults = results || [];
  const safeEvents = events || [];

  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const assignedClasses = teacher?.assigned_classes || ['4th Year CSE A', '3rd Year CSE B'];
  const assignedSubjects = teacher?.assigned_subjects || ['Data Structures & Algorithms', 'Database Systems'];

  // Students belonging to assigned classes
  const assignedStudents = useMemo(() => {
    return safeStudents.filter((s) => {
      const cls = `${s.year} ${s.department} ${s.section}`;
      return assignedClasses.includes(cls) || assignedClasses.some((c) => c.includes(s.department));
    });
  }, [safeStudents, assignedClasses]);

  const filteredStudents = useMemo(() => {
    return assignedStudents.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.house.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [assignedStudents, searchTerm]);

  // Pending grading count
  const pendingGradingSubmissions = safeSubmissions.filter((s) => s.status === 'Submitted');

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div id="teacher-dashboard-view" className="space-y-6">
      {/* Teacher Welcome Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/25">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{teacher?.designation || 'Faculty Instructor'} • {teacher?.department || 'CSE'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              {greeting}, {teacher?.name || 'Teacher'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
              Faculty Teaching Hub. Manage assigned cohorts, evaluate pending submissions, enter continuous assessment marks, and review student progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('gradebook')}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 text-xs font-bold shadow-lg hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Enter Internal Marks</span>
            </button>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Assigned Classes */}
        <div
          onClick={() => onNavigateTab('gradebook')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Classes
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {assignedClasses.length}
          </div>
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold mt-2">
            <span>{assignedClasses.join(', ')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Assigned Subjects */}
        <div
          onClick={() => onNavigateTab('gradebook')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Subjects
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {assignedSubjects.length}
          </div>
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-2">
            <span>Active Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Total Students in cohort */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Students
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {assignedStudents.length || safeStudents.length}
          </div>
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold mt-2">
            <span>Enrolled Students</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Pending Submissions */}
        <div
          onClick={() => onNavigateTab('assignments')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Submissions
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
            {pendingGradingSubmissions.length}
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">
            <span>Awaiting Evaluation</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* Two-Column Section: Today's Classes & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Today's Classes & Lectures
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Spring Schedule</span>
          </div>

          <div className="space-y-3">
            {assignedClasses.map((cls, idx) => (
              <div
                key={cls}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {cls}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Subject: {assignedSubjects[idx % assignedSubjects.length] || 'Computer Science'} • Room {200 + idx * 4}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  {idx === 0 ? '09:30 AM' : '02:00 PM'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Recent Submissions
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Grade All
            </button>
          </div>

          <div className="space-y-3">
            {safeSubmissions.slice(0, 3).map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {sub.student_name} ({sub.student_id})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sub.assignment_title || 'Course Assignment'} • {sub.submitted_at}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                  sub.status === 'Graded'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}>
                  {sub.status === 'Graded' ? `${sub.marks}/100` : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Upcoming Assignments & Student Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Active Assignments
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {safeAssignments.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {a.class_name} • Due: {a.due_date}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  {a.max_marks} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Student Performance Roster */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Cohort Performance
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('gradebook')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Gradebook
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {filteredStudents.slice(0, 5).map((st) => (
              <div
                key={st.id}
                onClick={() => onSelectStudent(st)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between hover:border-indigo-400 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {st.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {st.student_id} • {st.house} House
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
