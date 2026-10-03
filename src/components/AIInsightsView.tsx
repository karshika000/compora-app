import React, { useState } from 'react';
import {
  Sparkles,
  UserCheck,
  Trophy,
  FileText,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Student, HouseStats, CollegeEvent, Achievement, EventParticipation } from '../types';
import { HOUSE_THEMES, getHouseTheme } from '../utils/houseTheme';

interface AIInsightsViewProps {
  students: Student[];
  events: CollegeEvent[];
  achievements: Achievement[];
  participations: EventParticipation[];
  houseStats: HouseStats[];
  preSelectedStudentId?: string;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  students = [],
  events = [],
  achievements = [],
  participations = [],
  houseStats = [],
  preSelectedStudentId,
}) => {
  const safeStudents = students || [];
  const safeEvents = events || [];
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];
  const safeHouseStats = houseStats || [];

  const [activeAITab, setActiveAITab] = useState<'student' | 'houses' | 'executive' | 'dropout'>(
    'student'
  );

  // Student Evaluation State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preSelectedStudentId || safeStudents[0]?.student_id || ''
  );
  const [studentAnalysisResult, setStudentAnalysisResult] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // House Analysis State
  const [houseAnalysisResult, setHouseAnalysisResult] = useState<any>(null);
  const [loadingHouse, setLoadingHouse] = useState(false);

  // Executive Report State
  const [executiveReportResult, setExecutiveReportResult] = useState<any>(null);
  const [loadingExecutive, setLoadingExecutive] = useState(false);

  // Trigger Student Evaluation
  const runStudentAnalysis = async (sId?: string) => {
    const idToAnalyze = sId || selectedStudentId;
    if (!idToAnalyze) return;

    setLoadingStudent(true);
    setStudentAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/analyze-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: idToAnalyze }),
      });
      const data = await res.json();
      setStudentAnalysisResult(data);
    } catch (err) {
      console.error('Failed to run AI student analysis:', err);
    } finally {
      setLoadingStudent(false);
    }
  };

  // Trigger House Comparative Analysis
  const runHouseAnalysis = async () => {
    setLoadingHouse(true);
    setHouseAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/house-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setHouseAnalysisResult(data);
    } catch (err) {
      console.error('Failed to run AI house analysis:', err);
    } finally {
      setLoadingHouse(false);
    }
  };

  // Trigger Executive Report Generation
  const runExecutiveReport = async () => {
    setLoadingExecutive(true);
    setExecutiveReportResult(null);

    try {
      const res = await fetch('/api/ai/executive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setExecutiveReportResult(data);
    } catch (err) {
      console.error('Failed to run AI executive report:', err);
    } finally {
      setLoadingExecutive(false);
    }
  };

  // Calculate Zero-Participation Students for Engagement Predictor
  const zeroParticipationStudents = students.filter((s) => {
    const hasPart = participations.some((p) => p.student_id === s.student_id);
    const hasAch = achievements.some((a) => a.student_id === s.student_id);
    return !hasPart && !hasAch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>COMPORA Neural Intelligence Core</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
            AI-Powered Student & Championship Analytics
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Harness generative intelligence for automated student capability profiling, win-probability forecasting for Red, Blue, Green, and Yellow Houses, and institutional executive report generation.
          </p>
        </div>

        {/* Backdrop visual glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* AI Feature Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveAITab('student')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeAITab === 'student'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          👨‍🎓 Student Capability Profiler
        </button>
        <button
          onClick={() => setActiveAITab('houses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeAITab === 'houses'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          🏰 House Win-Probability & Momentum
        </button>
        <button
          onClick={() => setActiveAITab('executive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeAITab === 'executive'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          📑 Executive Annual AI Report
        </button>
        <button
          onClick={() => setActiveAITab('dropout')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeAITab === 'dropout'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          ⚠️ Engagement & Uplift Predictor
        </button>
      </div>

      {/* 1. STUDENT PROFILER & EVALUATION */}
      {activeAITab === 'student' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1 font-display">
              Select Student for AI Evaluation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              The AI model analyzes the student's competitive honors, event history, house points, and department curriculum to deliver personalized recommendations.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_id} - {s.name} ({s.department}, {s.year}, {s.house} House)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => runStudentAnalysis()}
                disabled={loadingStudent}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loadingStudent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Card */}
          {studentAnalysisResult && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-200 dark:border-purple-800/80 shadow-md space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                      {studentAnalysisResult.studentName}
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      {studentAnalysisResult.studentId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    AI Capability Profile & Institutional Assessment
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                      Activity Quotient
                    </span>
                    <span className="text-sm font-black text-purple-700 dark:text-purple-400">
                      {studentAnalysisResult.activityQuotient}
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center text-purple-700 dark:text-purple-300">
                    <span className="text-[10px] font-bold uppercase">Score</span>
                    <span className="text-base font-black font-display">
                      {studentAnalysisResult.overallScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300 block mb-1">
                  AI Institutional Verdict
                </span>
                <p className="text-xs text-purple-950 dark:text-purple-200 leading-relaxed">
                  {studentAnalysisResult.executiveSummary}
                </p>
              </div>

              {/* Strengths & Growth Areas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Key Demonstrated Strengths</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                    {studentAnalysisResult.strengths?.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2.5">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Target Growth Areas</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
                    {studentAnalysisResult.growthAreas?.map((gro: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{gro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Recommended Activities */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Tailored Event Recommendations</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {studentAnalysisResult.recommendedActivities?.map((act: string, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-600 transition"
                    >
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                        Recommended Track #{i + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-white mt-1 leading-snug">
                        {act}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. HOUSE COMPARATIVE AI ANALYSIS */}
      {activeAITab === 'houses' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                Inter-House Championship Forecasting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Computes real-time lead probability, participant momentum, and strategic tactics for Red, Blue, Green, and Yellow Houses.
              </p>
            </div>

            <button
              onClick={runHouseAnalysis}
              disabled={loadingHouse}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {loadingHouse ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Championship...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Championship Audit</span>
                </>
              )}
            </button>
          </div>

          {houseAnalysisResult && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-200 dark:border-purple-800/80 shadow-md space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                    Forecaster Lead Verdict
                  </span>
                  <div className="text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5 font-display">
                    House {houseAnalysisResult.winningHouse} currently favored with {houseAnalysisResult.winProbability}% win probability
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                {houseAnalysisResult.overallVerdict}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {houseAnalysisResult.comparisons?.map((c: any) => {
                  const theme = getHouseTheme(c.house);
                  return (
                    <div
                      key={c.house}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 transition shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.dotColor}`} />
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white font-display">
                            {c.house} House
                          </h4>
                          <span>{theme.emoji}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Momentum: {c.momentum}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">Participation:</strong> {c.participationStrength}
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">Achievements:</strong> {c.achievementQuality}
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-indigo-700 dark:text-indigo-400">
                          <strong className="text-indigo-900 dark:text-indigo-300">Recommended Strategy:</strong> {c.strategicAdvice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. EXECUTIVE ANNUAL AI REPORT */}
      {activeAITab === 'executive' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                Dean & Academic Council Executive Activity Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generates a formal, board-ready institutional evaluation covering student participation metrics and recommendations.
              </p>
            </div>

            <button
              onClick={runExecutiveReport}
              disabled={loadingExecutive}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {loadingExecutive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting Report...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Executive Report</span>
                </>
              )}
            </button>
          </div>

          {executiveReportResult && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6 max-w-4xl mx-auto print:border-none print:shadow-none animate-in fade-in duration-200">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  CONFIDENTIAL INSTITUTIONAL AUDIT
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 font-display">
                  {executiveReportResult.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generated: {executiveReportResult.date}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Executive Summary
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {executiveReportResult.executiveSummary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  House Championship & Student Culture Review
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {executiveReportResult.houseChampionshipReview}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Departmental Performance Highlights
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {executiveReportResult.departmentalHighlights}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Academic Year Cohort Engagement
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {executiveReportResult.studentEngagementAssessment}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Strategic Institutional Recommendations</span>
                </h4>
                <div className="space-y-2">
                  {executiveReportResult.actionableRecommendations?.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-2.5"
                    >
                      <span className="font-bold text-purple-700 dark:text-purple-400">{idx + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ENGAGEMENT & DROPOUT RISK PREDICTOR */}
      {activeAITab === 'dropout' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                Student Engagement & Inactivity Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identifies students with 0 event registrations and 0 recorded achievements to facilitate mentor outreach.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
              {zeroParticipationStudents.length} Students Needing Uplift
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Year & Section</th>
                  <th className="py-3.5 px-4">House</th>
                  <th className="py-3.5 px-4">Intervention Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {zeroParticipationStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      🎉 Outstanding! All students have recorded activities.
                    </td>
                  </tr>
                ) : (
                  zeroParticipationStudents.map((st) => {
                    const theme = getHouseTheme(st.house);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.student_id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{st.name}</td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{st.department}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {st.year} ({st.section})
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                            {st.house} House
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-400 font-medium">
                          Assign {st.house} House captain to enroll in upcoming intramural event
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
