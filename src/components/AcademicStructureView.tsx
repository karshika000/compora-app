import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Plus,
  Building,
  GraduationCap,
  Hash,
  Users,
  Award,
  Check,
  Calendar,
} from 'lucide-react';
import { AcademicClass, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

interface AcademicStructureViewProps {
  classes: AcademicClass[];
  subjects: Subject[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const AcademicStructureView: React.FC<AcademicStructureViewProps> = ({
  classes,
  subjects,
  onRefresh,
  onAddToast,
}) => {
  const { authFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'subjects'>('classes');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // New Class Form
  const [classForm, setClassForm] = useState({
    name: '',
    department: 'CSE',
    year: '1st Year',
    section: 'Section A',
    class_advisor: '',
  });

  // New Subject Form
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    department: 'CSE',
    semester: 'Semester 1',
    year: '1st Year',
    credits: 4,
  });

  const departments = ['CSE', 'IT', 'AI&DS', 'CSBS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'BME'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['Section A', 'Section B'];

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedName = `${classForm.year} ${classForm.department} ${classForm.section.replace('Section ', '')}`;
    try {
      const res = await authFetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...classForm, name: generatedName }),
      });
      if (res.ok) {
        onAddToast(`Class "${generatedName}" successfully registered`, 'success', 'Class Added');
        setIsAddClassModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to create class', 'error');
      }
    } catch {
      onAddToast('Network error during class registration', 'error');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.name) {
      onAddToast('Subject code and title are required', 'error');
      return;
    }
    try {
      const res = await authFetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm),
      });
      if (res.ok) {
        onAddToast(`Course "${subjectForm.name}" registered`, 'success', 'Course Added');
        setIsAddSubjectModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to create subject', 'error');
      }
    } catch {
      onAddToast('Network error during course creation', 'error');
    }
  };

  return (
    <div id="academic-structure-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Academic Structure & Curriculum
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure institutional academic years, departments, class rosters, and accredited subjects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'classes' ? (
            <button
              onClick={() => setIsAddClassModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Class</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddSubjectModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Classes & Sections ({classes.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects & Curriculum ({subjects.length})</span>
        </button>
      </div>

      {/* Classes Sub-View */}
      {activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:shadow-xs transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cls.name}</h3>
                    <p className="text-xs text-slate-500">{cls.department}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {cls.section}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span>Year Level:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enrolled Students:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {cls.student_count || 12} Students
                  </span>
                </div>
                {cls.class_advisor && (
                  <div className="flex items-center justify-between">
                    <span>Class Advisor:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cls.class_advisor}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects Sub-View */}
      {activeSubTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 hover:shadow-xs transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                    {sub.code.substring(0, 4)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{sub.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{sub.code}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  {sub.credits} Credits
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span>Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Semester / Level:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{sub.semester} ({sub.year})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
              Register New Academic Class
            </h2>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={classForm.department}
                  onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={classForm.year}
                    onChange={(e) => setClassForm({ ...classForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {sections.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Class Advisor / Faculty Lead
                </label>
                <input
                  type="text"
                  value={classForm.class_advisor}
                  onChange={(e) => setClassForm({ ...classForm, class_advisor: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
              Add Curriculum Subject
            </h2>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS401"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Title *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Distributed Cloud Computing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={subjectForm.department}
                    onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
