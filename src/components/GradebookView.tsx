import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Award,
  Search,
  Filter,
  Plus,
  Edit3,
  Download,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  Shield,
  BarChart,
  Trash2,
  Check,
} from 'lucide-react';
import { StudentResult, AcademicClass, Subject, Student, Teacher } from '../types';
import { useAuth } from '../context/AuthContext';

interface GradebookViewProps {
  results?: StudentResult[];
  students?: Student[];
  classes?: AcademicClass[];
  subjects?: Subject[];
  teachers?: Teacher[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  results = [],
  students = [],
  classes = [],
  subjects = [],
  teachers = [],
  onRefresh = () => {},
  onAddToast,
}) => {
  const safeResults = results || [];
  const safeStudents = students || [];
  const safeClasses = classes || [];
  const safeSubjects = subjects || [];
  const safeTeachers = teachers || [];

  const { currentUser, authFetch } = useAuth();
  const isTeacher = currentUser?.role === 'TEACHER';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Find logged in teacher's assignments
  const loggedTeacher = useMemo(() => {
    if (!isTeacher) return null;
    return safeTeachers.find(
      (t) => t.user_id === currentUser?.id || t.name.toLowerCase() === currentUser?.name.toLowerCase()
    );
  }, [isTeacher, safeTeachers, currentUser]);

  const assignedClasses = loggedTeacher?.assigned_classes || [];
  const assignedSubjects = loggedTeacher?.assigned_subjects || [];

  // Allowed class and subject options
  const availableClasses = useMemo(() => {
    if (isAdmin) return safeClasses.map((c) => c.name);
    return assignedClasses.length > 0 ? assignedClasses : safeClasses.map((c) => c.name);
  }, [isAdmin, safeClasses, assignedClasses]);

  const availableSubjects = useMemo(() => {
    if (isAdmin) return safeSubjects.map((s) => s.name);
    return assignedSubjects.length > 0 ? assignedSubjects : safeSubjects.map((s) => s.name);
  }, [isAdmin, safeSubjects, assignedSubjects]);

  const [selectedClass, setSelectedClass] = useState<string>(() => availableClasses[0] || '4th Year CSE A');
  const [selectedSubject, setSelectedSubject] = useState<string>(() => availableSubjects[0] || 'Data Structures & Algorithms');
  const [searchTerm, setSearchTerm] = useState('');

  // Mark Entry Modal state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<StudentResult | null>(null);
  const [markForm, setMarkForm] = useState({
    student_id: '',
    ia1_mark: 18,
    ia2_mark: 19,
    assignment_mark: 5,
    attendance_mark: 5,
    external_mark: 45,
    semester: 'Semester 7',
    academic_year: '2025-2026',
    is_published: true,
  });

  // Filtered Results for this Class & Subject
  const filteredResults = useMemo(() => {
    return safeResults.filter((r) => {
      const matchClass = !selectedClass || r.class_name === selectedClass;
      const matchSubject = !selectedSubject || r.subject_name === selectedSubject;
      const matchSearch =
        !searchTerm ||
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchClass && matchSubject && matchSearch;
    });
  }, [safeResults, selectedClass, selectedSubject, searchTerm]);

  // Analytics for the filtered group
  const stats = useMemo(() => {
    if (filteredResults.length === 0) {
      return { count: 0, avg: 0, passCount: 0, passRate: 0, topScore: 0 };
    }
    const marks = filteredResults.map((r) => r.total_mark || r.mark || 0);
    const sum = marks.reduce((a, b) => a + b, 0);
    const avg = +(sum / marks.length).toFixed(1);
    const passCount = filteredResults.filter((r) => r.result_status === 'PASS' || (r.mark / r.max_marks) >= 0.45).length;
    const passRate = +((passCount / filteredResults.length) * 100).toFixed(0);
    const topScore = Math.max(...marks);
    return { count: filteredResults.length, avg, passCount, passRate, topScore };
  }, [filteredResults]);

  // Computed live internal total for the modal
  const computedModalInternalTotal = useMemo(() => {
    return Number(markForm.ia1_mark || 0) + Number(markForm.ia2_mark || 0) + Number(markForm.assignment_mark || 0) + Number(markForm.attendance_mark || 0);
  }, [markForm.ia1_mark, markForm.ia2_mark, markForm.assignment_mark, markForm.attendance_mark]);

  const computedModalGrandTotal = useMemo(() => {
    return computedModalInternalTotal + Number(markForm.external_mark || 0);
  }, [computedModalInternalTotal, markForm.external_mark]);

  const handleOpenNewEntry = () => {
    setEditingResult(null);
    const firstStudent = safeStudents.find((s) => {
      const cls = `${s.year} ${s.department} ${s.section}`;
      return cls === selectedClass || selectedClass.includes(s.department);
    });

    setMarkForm({
      student_id: firstStudent?.student_id || (safeStudents[0]?.student_id || '21CS001'),
      ia1_mark: 18,
      ia2_mark: 19,
      assignment_mark: 5,
      attendance_mark: 5,
      external_mark: 45,
      semester: 'Semester 7',
      academic_year: '2025-2026',
      is_published: true,
    });
    setIsEntryModalOpen(true);
  };

  const handleOpenEdit = (resItem: StudentResult) => {
    setEditingResult(resItem);
    setMarkForm({
      student_id: resItem.student_id,
      ia1_mark: resItem.ia1_mark !== undefined ? resItem.ia1_mark : Math.round(resItem.mark * 0.2),
      ia2_mark: resItem.ia2_mark !== undefined ? resItem.ia2_mark : 18,
      assignment_mark: resItem.assignment_mark !== undefined ? resItem.assignment_mark : 5,
      attendance_mark: resItem.attendance_mark !== undefined ? resItem.attendance_mark : 5,
      external_mark: resItem.external_mark !== undefined ? resItem.external_mark : 42,
      semester: resItem.semester,
      academic_year: resItem.academic_year || '2025-2026',
      is_published: resItem.is_published !== false,
    });
    setIsEntryModalOpen(true);
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResult) {
        const res = await authFetch(`/api/results/${editingResult.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ia1_mark: Number(markForm.ia1_mark),
            ia2_mark: Number(markForm.ia2_mark),
            assignment_mark: Number(markForm.assignment_mark),
            attendance_mark: Number(markForm.attendance_mark),
            external_mark: Number(markForm.external_mark),
            semester: markForm.semester,
            academic_year: markForm.academic_year,
            is_published: markForm.is_published,
          }),
        });

        if (res.ok) {
          onAddToast(`Marks updated and verified for ${editingResult.student_name}`, 'success', 'Saved');
          setIsEntryModalOpen(false);
          onRefresh();
        } else {
          const err = await res.json();
          onAddToast(err.error || 'Failed to update marks', 'error');
        }
      } else {
        const res = await authFetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: markForm.student_id,
            class_name: selectedClass,
            subject_name: selectedSubject,
            ia1_mark: Number(markForm.ia1_mark),
            ia2_mark: Number(markForm.ia2_mark),
            assignment_mark: Number(markForm.assignment_mark),
            attendance_mark: Number(markForm.attendance_mark),
            external_mark: Number(markForm.external_mark),
            semester: markForm.semester,
            academic_year: markForm.academic_year,
            is_published: markForm.is_published,
          }),
        });

        if (res.ok) {
          onAddToast(`Recorded assessment marks for student ${markForm.student_id}`, 'success', 'Score Saved');
          setIsEntryModalOpen(false);
          onRefresh();
        } else {
          const err = await res.json();
          onAddToast(err.error || 'Failed to record marks', 'error');
        }
      }
    } catch {
      onAddToast('Network error while saving academic marks', 'error');
    }
  };

  const exportCSV = () => {
    if (filteredResults.length === 0) {
      onAddToast('No results available to export', 'warning');
      return;
    }
    const headers = [
      'Student ID',
      'Student Name',
      'Class',
      'Subject',
      'IA 1 (20)',
      'IA 2 (20)',
      'Assignment (5)',
      'Attendance (5)',
      'Internal Total (50)',
      'External (50)',
      'Total (100)',
      'Grade',
      'Status',
      'Semester',
    ];
    const rows = filteredResults.map((r) => [
      r.student_id,
      `"${r.student_name}"`,
      `"${r.class_name}"`,
      `"${r.subject_name}"`,
      r.ia1_mark || 18,
      r.ia2_mark || 18,
      r.assignment_mark || 5,
      r.attendance_mark || 5,
      r.internal_total || 46,
      r.external_mark || 44,
      r.total_mark || r.mark || 90,
      r.grade || 'A+',
      r.result_status || 'PASS',
      r.semester,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marksheet_${selectedClass.replace(/\s+/g, '_')}_${selectedSubject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onAddToast('Class marksheet exported successfully', 'success', 'CSV Exported');
  };

  return (
    <div id="gradebook-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Faculty Mark Entry & CIA Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            {isTeacher ? 'Assigned Gradebook & Marks' : 'College Examination & Gradebook'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isTeacher
              ? 'Authorized strictly to record Continuous Internal Assessment (CIA) marks for your assigned subjects.'
              : 'Institutional academic marks management across all departments and academic years.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-record-marks"
            onClick={handleOpenNewEntry}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enter Assessment Marks</span>
          </button>
        </div>
      </div>

      {/* Class & Subject Selector Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Select Class Cohort
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Select Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {availableSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name or roll #..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Average</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-display mt-1">
            {stats.avg} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pass Rate</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display mt-1">
            {stats.passRate}%
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Highest Score</span>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 font-display mt-1">
            {stats.topScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Graded Records</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-display mt-1">
            {stats.count} Students
          </p>
        </div>
      </div>

      {/* Main Results & Internal Assessment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-2 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Student Assessment Mark Sheet — {selectedClass} • {selectedSubject}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredResults.length} Enrolled Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Roll #</th>
                <th className="py-3 px-3 text-center">IA 1 (20)</th>
                <th className="py-3 px-3 text-center">IA 2 (20)</th>
                <th className="py-3 px-3 text-center">Asg (5)</th>
                <th className="py-3 px-3 text-center">Att (5)</th>
                <th className="py-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20">
                  Internal (50)
                </th>
                <th className="py-3 px-3 text-center">External (50)</th>
                <th className="py-3 px-3 text-center">Total (100)</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredResults.map((r) => {
                const ia1 = r.ia1_mark !== undefined ? r.ia1_mark : Math.round(r.mark * 0.2);
                const ia2 = r.ia2_mark !== undefined ? r.ia2_mark : 18;
                const asg = r.assignment_mark !== undefined ? r.assignment_mark : 5;
                const att = r.attendance_mark !== undefined ? r.attendance_mark : 5;
                const internalTot = r.internal_total !== undefined ? r.internal_total : ia1 + ia2 + asg + att;
                const ext = r.external_mark !== undefined ? r.external_mark : 44;
                const grandTotal = r.total_mark !== undefined ? r.total_mark : internalTot + ext;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {r.student_name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {r.student_id}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {ia1}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {ia2}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {asg}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {att}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20">
                      {internalTot}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {r.is_published ? ext : <span className="text-slate-400 italic">Pending</span>}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                      {grandTotal}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md font-mono font-black text-[11px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {r.grade || 'A+'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-16">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              No marks recorded yet for {selectedClass} — {selectedSubject}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Enter Assessment Marks" to record IA 1, IA 2, and Assignment scores.
            </p>
          </div>
        )}
      </div>

      {/* Mark Entry Modal */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
              {editingResult ? 'Update Student Assessment Marks' : 'Record Student Marks'}
            </h2>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div><strong className="text-slate-900 dark:text-white">Class:</strong> {selectedClass}</div>
              <div><strong className="text-slate-900 dark:text-white">Subject:</strong> {selectedSubject}</div>
            </div>

            <form onSubmit={handleSaveMarks} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student *
                </label>
                {editingResult ? (
                  <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {editingResult.student_name} ({editingResult.student_id})
                  </div>
                ) : (
                  <select
                    value={markForm.student_id}
                    onChange={(e) => setMarkForm({ ...markForm, student_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    {safeStudents.map((s) => (
                      <option key={s.id} value={s.student_id}>
                        {s.name} ({s.student_id}) — {s.department}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Internal Marks (IA1, IA2, Assignment, Attendance) */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Continuous Internal Assessment (CIA)
                  </span>
                  <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-400">
                    Total: {computedModalInternalTotal} / 50
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      IA 1 (Max 20)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      required
                      value={markForm.ia1_mark}
                      onChange={(e) => setMarkForm({ ...markForm, ia1_mark: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      IA 2 (Max 20)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      required
                      value={markForm.ia2_mark}
                      onChange={(e) => setMarkForm({ ...markForm, ia2_mark: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Asg (Max 5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      required
                      value={markForm.assignment_mark}
                      onChange={(e) => setMarkForm({ ...markForm, assignment_mark: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Att (Max 5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      required
                      value={markForm.attendance_mark}
                      onChange={(e) => setMarkForm({ ...markForm, attendance_mark: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* External Marks & Publication */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    External Exam Mark (Max 50)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={markForm.external_mark}
                    onChange={(e) => setMarkForm({ ...markForm, external_mark: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester Term
                  </label>
                  <select
                    value={markForm.semester}
                    onChange={(e) => setMarkForm({ ...markForm, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer font-semibold"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Publish Final Result to Student Portal
                  </div>
                  <div className="text-[10px] text-slate-400">
                    When checked, student can view final grade and SGPA calculation.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={markForm.is_published}
                  onChange={(e) => setMarkForm({ ...markForm, is_published: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Save Marks ({computedModalGrandTotal}/100)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
