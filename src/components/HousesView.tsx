import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  Users,
  Award,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HouseStats, Student, Achievement, EventParticipation, HouseName } from '../types';
import { calculateAchievementPoints } from '../utils/stats';
import { HOUSE_THEMES, getHouseTheme } from '../utils/houseTheme';

interface HousesViewProps {
  houseStats: HouseStats[];
  students: Student[];
  achievements: Achievement[];
  participations: EventParticipation[];
  onSelectStudent: (student: Student) => void;
  onNavigateToAI: () => void;
}

export const HousesView: React.FC<HousesViewProps> = ({
  houseStats = [],
  students = [],
  achievements = [],
  participations = [],
  onSelectStudent = () => {},
  onNavigateToAI = () => {},
}) => {
  const safeHouseStats = houseStats || [];
  const safeStudents = students || [];
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];

  const [selectedHouse, setSelectedHouse] = useState<HouseName>(safeHouseStats[0]?.house || 'Red');

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  const winningHouse = safeHouseStats[0];

  // Students belonging to the active house
  const houseStudents = safeStudents.filter((s) => s.house === selectedHouse);

  // Map student_id to achievements
  const studentPointsMap = new Map<string, { achPoints: number; partPoints: number; total: number }>();
  houseStudents.forEach((st) => {
    const achs = safeAchievements.filter((a) => a.student_id === st.student_id);
    const parts = safeParticipations.filter((p) => p.student_id === st.student_id);
    let achPoints = 0;
    achs.forEach((a) => (achPoints += calculateAchievementPoints(a.level)));
    const partPoints = parts.length * 5;
    studentPointsMap.set(st.student_id, {
      achPoints,
      partPoints,
      total: achPoints + partPoints,
    });
  });

  // Sort house students by points descending
  const sortedHouseStudents = [...houseStudents].sort((a, b) => {
    const ptsA = studentPointsMap.get(a.student_id)?.total || 0;
    const ptsB = studentPointsMap.get(b.student_id)?.total || 0;
    return ptsB - ptsA;
  });

  const selectedTheme = getHouseTheme(selectedHouse);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Module 05
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Inter-House Championship & Standings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Red, Blue, Green, and Yellow Houses compete across technical events, sports, and competitive awards.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={triggerConfetti}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition shadow-xs cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Celebrate Leader</span>
          </button>
          <button
            onClick={onNavigateToAI}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI House Odds</span>
          </button>
        </div>
      </div>

      {/* 4 Big House Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {houseStats.map((h) => {
          const theme = getHouseTheme(h.house);
          const isSelected = selectedHouse === h.house;
          const isWinner = h.rank === 1;

          return (
            <div
              key={h.house}
              onClick={() => setSelectedHouse(h.house)}
              className={`p-5 rounded-3xl border-2 transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? `${theme.badgeBorder} ${theme.badgeBg} shadow-md`
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              {isWinner && (
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                  <Trophy className="w-2.5 h-2.5" /> Leader
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText}`}
                  >
                    Rank #{h.rank}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {h.studentCount} students
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white font-display">
                    {h.house} House
                  </h3>
                  <span className="text-lg">{theme.emoji}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{theme.mascot}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                  "{theme.motto}"
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Championship Score
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-display mt-0.5">
                    {h.totalPoints}{' '}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">pts</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Achievements</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{h.achievementPoints} pts</span>
                  <span className="text-[10px] text-slate-400 block">({h.achievementCount} wins)</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Participation</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{h.participationPoints} pts</span>
                  <span className="text-[10px] text-slate-400 block">({h.participationCount} entries)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected House Detailed Roster and Top Contributors */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${selectedTheme.dotColor}`} />
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                {selectedHouse} House Student Roster & Standings
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Individual contributions from students in {selectedHouse} House towards the championship.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            Total Members: <strong className="text-slate-900 dark:text-white">{houseStudents.length}</strong>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Rank in House</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Department & Year</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4 text-center">Achievements</th>
                <th className="py-3.5 px-4 text-center">Participations</th>
                <th className="py-3.5 px-4 text-right">House Pts Contributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedHouseStudents.map((st, idx) => {
                const stats = studentPointsMap.get(st.student_id) || {
                  achPoints: 0,
                  partPoints: 0,
                  total: 0,
                };

                return (
                  <tr
                    key={st.id}
                    onClick={() => onSelectStudent(st)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {idx === 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black">
                          <Trophy className="w-3.5 h-3.5" /> #1 MVP
                        </span>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {st.student_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {st.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {st.department} • {st.year}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-500">{st.section}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                      {stats.achPoints > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">+{stats.achPoints} pts</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                      {stats.partPoints > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">+{stats.partPoints} pts</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                        {stats.total} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
