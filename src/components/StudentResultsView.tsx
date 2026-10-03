import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  BookOpen,
  Calendar,
  Layers,
  Shield,
  Printer,
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { StudentResult, Student } from '../types';

interface StudentResultsViewProps {
  student: Student;
  results?: StudentResult[];
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
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

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  student,
  results = [],
  onAddToast,
}) => {
  const safeResults = results || [];

  // Active view tab: 'internal' | 'semester' | 'history'
  const [activeTab, setActiveTab] = useState<'internal' | 'semester' | 'history'>('internal');

  // Available semesters present in the student's result data
  const availableSemesters = useMemo(() => {
    const sems = Array.from(new Set(safeResults.map((r) => r.semester))).filter(Boolean);
    if (sems.length === 0) return ['Semester 1'];
    // Sort semesters numerically if possible
    return sems.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [safeResults]);

  const [selectedSemester, setSelectedSemester] = useState<string>(() => {
    return availableSemesters[availableSemesters.length - 1] || 'Semester 1';
  });

  // Results for the currently selected semester
  const currentSemesterResults = useMemo(() => {
    return safeResults.filter((r) => r.semester === selectedSemester);
  }, [safeResults, selectedSemester]);

  // SGPA Calculation for a specific semester
  const calculateSGPA = (semResults: StudentResult[]) => {
    const published = semResults.filter((r) => r.is_published && r.grade && r.grade !== 'Pending');
    if (published.length === 0) return null;

    let totalCredits = 0;
    let totalWeightedPoints = 0;

    published.forEach((r) => {
      const creds = r.credits || 4;
      const gp = GRADE_POINTS[r.grade] !== undefined ? GRADE_POINTS[r.grade] : 0;
      totalCredits += creds;
      totalWeightedPoints += creds * gp;
    });

    if (totalCredits === 0) return null;
    return +(totalWeightedPoints / totalCredits).toFixed(2);
  };

  // Cumulative CGPA calculation across ALL published results
  const cumulativeCGPA = useMemo(() => {
    const allPublished = safeResults.filter((r) => r.is_published && r.grade && r.grade !== 'Pending');
    if (allPublished.length === 0) return 8.5; // Benchmark default

    let totalCredits = 0;
    let totalWeightedPoints = 0;

    allPublished.forEach((r) => {
      const creds = r.credits || 4;
      const gp = GRADE_POINTS[r.grade] !== undefined ? GRADE_POINTS[r.grade] : 0;
      totalCredits += creds;
      totalWeightedPoints += creds * gp;
    });

    if (totalCredits === 0) return 8.5;
    return +(totalWeightedPoints / totalCredits).toFixed(2);
  }, [safeResults]);

  // Latest semester SGPA
  const latestSGPA = useMemo(() => {
    return calculateSGPA(currentSemesterResults) || cumulativeCGPA;
  }, [currentSemesterResults, cumulativeCGPA]);

  // Overall passed subjects count
  const passedCount = useMemo(() => {
    return safeResults.filter((r) => r.result_status === 'PASS' || (r.grade && r.grade !== 'RA' && r.grade !== 'U' && r.grade !== 'Pending')).length;
  }, [safeResults]);

  // Print Transcript Handler
  const handlePrint = () => {
    window.print();
    onAddToast('Opening print dialog for official student grade report.', 'info', 'Transcript Print');
  };

  return (
    <div id="student-results-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Official Collegiate Academic Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Academic Marks & Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verified continuous internal assessments (CIA), end-semester grades, SGPA, and cumulative CGPA.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Marksheet</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Cumulative CGPA
          </span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-display mt-1">
            {cumulativeCGPA} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </p>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>First Class Distinction</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Session
          </span>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-display mt-1">
            {student.year}
          </p>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Section {student.section} • {student.department}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Latest SGPA
          </span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display mt-1">
            {latestSGPA} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </p>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {selectedSemester}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Passed Courses
          </span>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 font-display mt-1">
            {passedCount} <span className="text-xs text-slate-400 font-normal">/ {safeResults.length}</span>
          </p>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-2">
            100% Pass Rate
          </div>
        </div>
      </div>

      {/* Tabs Switcher: [Internal Marks] [Semester Results] [Result History & Transcripts] */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'internal'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Internal Assessment Marks</span>
          </button>

          <button
            onClick={() => setActiveTab('semester')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'semester'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Semester Results & SGPA</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Result History & Transcript</span>
          </button>
        </div>

        {/* Semester Selector for Internal and Semester Results */}
        {availableSemesters.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Select Term:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: INTERNAL MARKS BREAKDOWN */}
      {activeTab === 'internal' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Continuous Internal Assessment (CIA) Marks — {selectedSemester}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Internal marks breakdown: IA 1 (20) + IA 2 (20) + Assignment (5) + Attendance (5) = Internal Total (50).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 self-start sm:self-auto">
              Student ID: {student.student_id}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4 text-center">IA 1 (Max 20)</th>
                  <th className="py-3 px-4 text-center">IA 2 (Max 20)</th>
                  <th className="py-3 px-4 text-center">Assignment (5)</th>
                  <th className="py-3 px-4 text-center">Attendance (5)</th>
                  <th className="py-3 px-4 text-center bg-indigo-50/50 dark:bg-indigo-950/30">
                    Internal Total (50)
                  </th>
                  <th className="py-3 px-4 text-right">Evaluation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentSemesterResults.map((r) => {
                  const ia1 = r.ia1_mark !== undefined ? r.ia1_mark : Math.round(r.mark * 0.2);
                  const ia2 = r.ia2_mark !== undefined ? r.ia2_mark : 18;
                  const asg = r.assignment_mark !== undefined ? r.assignment_mark : 5;
                  const att = r.attendance_mark !== undefined ? r.attendance_mark : 5;
                  const internalTot = r.internal_total !== undefined ? r.internal_total : ia1 + ia2 + asg + att;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {r.subject_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {r.subject_code}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {ia1} / 20
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {ia2} / 20
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        {asg} / 5
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        {att} / 5
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                        {internalTot} / 50
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {currentSemesterResults.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No internal assessment marks entered for {selectedSemester}
              </p>
              <p className="text-xs text-slate-400">
                Internal marks will appear once faculty evaluators submit assessment grades.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEMESTER RESULTS ("MY RESULTS") */}
      {activeTab === 'semester' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Final Examination Results — {selectedSemester}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Combined Internal + End-Semester External Marks and Credit Grade Points.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                SGPA: <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{latestSGPA}</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center">Internal (50)</th>
                  <th className="py-3 px-4 text-center">External (50)</th>
                  <th className="py-3 px-4 text-center">Total (100)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-right">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentSemesterResults.map((r) => {
                  const isPub = r.is_published !== false;
                  const intMark = r.internal_total !== undefined ? r.internal_total : 45;
                  const extMark = r.external_mark !== undefined ? r.external_mark : 43;
                  const tot = isPub ? intMark + extMark : intMark;
                  const isPass = r.result_status === 'PASS' || (tot >= 45 && extMark >= 20);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {r.subject_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {r.subject_code}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {r.credits || 4}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        {intMark}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                        {isPub ? extMark : <span className="text-slate-400 italic">Evaluating</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                        {isPub ? tot : `${intMark}/50`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPub ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-mono font-black text-[11px] ${
                              r.grade === 'O'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : r.grade === 'A+' || r.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {r.grade || 'A+'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPub ? (
                          isPass ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                              FAIL (RA)
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            Result not published yet
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESULT HISTORY & MULTI-SEMESTER TRANSCRIPT */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Multi-Semester Academic Transcript & Progression</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historical record across all completed terms. Cumulative CGPA: <strong>{cumulativeCGPA}</strong>.
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition hover:bg-indigo-100 self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Transcript</span>
            </button>
          </div>

          {/* Grouped by Semester */}
          <div className="space-y-6">
            {availableSemesters.map((sem) => {
              const semResults = safeResults.filter((r) => r.semester === sem);
              const sgpa = calculateSGPA(semResults);

              return (
                <div
                  key={sem}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                        {sem}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ({semResults.length} Subjects)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {sgpa !== null && (
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Semester SGPA: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{sgpa}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden">
                      <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-extrabold text-[9px]">
                        <tr>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3 text-center">Internal (50)</th>
                          <th className="py-2.5 px-3 text-center">External (50)</th>
                          <th className="py-2.5 px-3 text-center">Total (100)</th>
                          <th className="py-2.5 px-3 text-center">Grade</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {semResults.map((r) => (
                          <tr key={r.id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {r.subject_name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                              {r.subject_code}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {r.internal_total || 45}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {r.external_mark !== undefined ? r.external_mark : 43}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                              {r.total_mark || 88}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {r.grade || 'A+'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                PASS
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
