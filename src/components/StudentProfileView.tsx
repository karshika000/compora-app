import React, { useState, useMemo } from 'react';
import {
  User,
  Shield,
  GraduationCap,
  Mail,
  Phone,
  Building,
  Calendar,
  Trophy,
  Star,
  Award,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Layers,
} from 'lucide-react';
import {
  Student,
  Achievement,
  EventParticipation,
  HouseColor,
  StudentResult,
  CollegeEvent,
} from '../types';
import { POINT_SYSTEM } from '../data/initialData';
import { useAuth } from '../context/AuthContext';

interface StudentProfileViewProps {
  student: Student;
  achievements?: Achievement[];
  participations?: EventParticipation[];
  results?: StudentResult[];
  events?: CollegeEvent[];
  onNavigateTab: (tab: any) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  achievements = [],
  participations = [],
  results = [],
  events = [],
  onNavigateTab = () => {},
}) => {
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];
  const safeResults = results || [];
  const safeEvents = events || [];
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'events' | 'achievements'>('overview');

  const myAchievements = safeAchievements.filter(
    (a) => a.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
  );
  const myParticipations = safeParticipations.filter(
    (p) => p.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
  );
  const myResults = safeResults.filter(
    (r) => r.student_id.toLowerCase() === (student?.student_id || '').toLowerCase()
  );

  const myEvents = useMemo(() => {
    const eventIds = new Set(myParticipations.map((p) => p.event_id));
    return safeEvents.filter((e) => eventIds.has(e.id));
  }, [safeEvents, myParticipations]);

  const totalPoints = myAchievements.reduce(
    (sum, a) => sum + (POINT_SYSTEM.achievements[a.level] || 10),
    0
  ) + myParticipations.length * 5;

  const houseThemes: Record<HouseColor, { bg: string; text: string; badge: string }> = {
    Red: {
      bg: 'from-rose-600 via-red-600 to-rose-700',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    },
    Blue: {
      bg: 'from-blue-600 via-indigo-600 to-blue-700',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    Green: {
      bg: 'from-emerald-600 via-teal-600 to-emerald-700',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    Yellow: {
      bg: 'from-amber-500 via-yellow-500 to-amber-600',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
  };

  const theme = houseThemes[student?.house as HouseColor] || houseThemes.Red;

  return (
    <div id="student-profile-view" className="space-y-6 max-w-5xl mx-auto">
      {/* Large Profile Header Dossier Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${theme.bg} text-white shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden`}>
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-extrabold text-4xl text-white shadow-lg shrink-0">
          {student.name.charAt(0)}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/20">
            <Shield className="w-3.5 h-3.5" />
            <span>{student.house} House • Official Student Record</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight">
            {student.name}
          </h1>

          <div className="text-xs sm:text-sm text-white/90 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md">{student.student_id}</span>
            <span>•</span>
            <span>Dept of {student.department}</span>
            <span>•</span>
            <span>{student.year} (Section {student.section})</span>
          </div>
        </div>

        {/* Quick Academic Summary KPIs */}
        <div className="flex sm:flex-col gap-3 shrink-0">
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
              CGPA Score
            </span>
            <span className="text-2xl font-black font-display">
              8.75
            </span>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
              Total Points
            </span>
            <span className="text-2xl font-black font-display text-amber-300">
              {totalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'academic'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Academic Transcripts</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'events'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Events & Participation ({myParticipations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'achievements'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Achievements ({myAchievements.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Institutional Credentials */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>Institutional Credentials</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Registration Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{student.student_id}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-900 dark:text-white">{student.department}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Academic Year</span>
                <span className="font-semibold text-slate-900 dark:text-white">{student.year}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Class Section</span>
                <span className="font-semibold text-slate-900 dark:text-white">{student.section}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Date of Birth</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {student.date_of_birth ? (
                    new Date(student.date_of_birth + 'T00:00:00').toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  ) : (
                    <span className="text-slate-400 italic font-normal">Not Provided</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Assigned House</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badge}`}>
                  {student.house} House
                </span>
              </div>
            </div>
          </div>

          {/* Account Status & Contact */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              <span>Contact & Account Security</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold text-slate-900 dark:text-white">{student.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Student
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Portal Username</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  @{currentUser?.username || student.student_id}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('settings')}
                className="w-full py-2.5 px-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Manage Security in Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Transcripts */}
      {activeTab === 'academic' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Saved Course Results & Marks
            </h2>
            <button
              onClick={() => onNavigateTab('student_results')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Full Transcript View
            </button>
          </div>

          <div className="space-y-3">
            {myResults.length > 0 ? (
              myResults.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {r.subject_name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {r.semester} • Internal: {r.internal_total}/50 • External: {r.external_mark || 0}/50
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    {(r.internal_total || 0) + (r.external_mark || 0)}/100 ({r.grade || 'A'})
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No published results found for this term.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Events & Participation */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Event Registrations ({myParticipations.length})
          </h2>

          <div className="space-y-3">
            {myEvents.length > 0 ? (
              myEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {evt.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {evt.date} • {evt.venue || 'Campus Auditorium'} • Category: {evt.category}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    +5 pts
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No event entries yet. Explore upcoming campus symposiums and workshops!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Achievements */}
      {activeTab === 'achievements' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Accredited Honors & Awards ({myAchievements.length})
            </h2>
            <span className="text-xs font-bold text-amber-500">
              Total Points: {totalPoints}
            </span>
          </div>

          <div className="space-y-3">
            {myAchievements.length > 0 ? (
              myAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {ach.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {ach.category} • {ach.level} Level • {ach.date}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    +{POINT_SYSTEM.achievements[ach.level] || 10} pts
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No honors logged yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
