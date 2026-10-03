import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Users,
  Search,
  MessageSquare,
  FileCheck,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Assignment, AssignmentSubmission, AcademicClass, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

interface AssignmentsViewProps {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  classes: AcademicClass[];
  subjects: Subject[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments = [],
  submissions = [],
  classes = [],
  subjects = [],
  onRefresh = () => {},
  onAddToast,
}) => {
  const safeAssignments = assignments || [];
  const safeSubmissions = submissions || [];
  const safeClasses = classes || [];
  const safeSubjects = subjects || [];

  const { currentUser, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject_name: safeSubjects[0]?.name || 'Data Structures & Algorithms',
    class_name: safeClasses[0]?.name || '4th Year CSE A',
    description: '',
    instructions: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    max_marks: 100,
    attachment_name: 'Assignment_Problem_Statement.pdf',
  });

  // Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeData, setGradeData] = useState({ marks: 90, feedback: 'Well structured and thoroughly answered.' });

  const filteredAssignments = useMemo(() => {
    return safeAssignments.filter((a) => {
      return (
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.class_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [safeAssignments, searchTerm]);

  const filteredSubmissions = useMemo(() => {
    return safeSubmissions.filter((s) => {
      return (
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.assignment_title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [safeSubmissions, searchTerm]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.due_date) {
      onAddToast('Assignment title and due date are required', 'error');
      return;
    }

    try {
      const res = await authFetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
      });

      if (res.ok) {
        onAddToast(`Assignment "${newAssignment.title}" published!`, 'success', 'Assignment Created');
        setIsCreateModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to publish assignment', 'error');
      }
    } catch {
      onAddToast('Network error creating assignment', 'error');
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      const res = await authFetch(`/api/submissions/${gradingSubmission.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData),
      });

      if (res.ok) {
        onAddToast(`Graded submission for ${gradingSubmission.student_name}`, 'success', 'Submission Graded');
        setGradingSubmission(null);
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to grade submission', 'error');
      }
    } catch {
      onAddToast('Network error saving grade', 'error');
    }
  };

  return (
    <div id="assignments-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Assignments & Coursework Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish coursework, distribute problem sets, and review/grade student submissions with instant feedback.
          </p>
        </div>

        <button
          id="btn-create-assignment"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Active Assignments ({assignments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Submissions & Grading ({submissions.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assignments or students..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Assignments Tab Content */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((asg) => (
            <div
              key={asg.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-xs transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {asg.subject_name}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5 line-clamp-1">
                      {asg.title}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    Max: {asg.max_marks}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {asg.description || asg.instructions || 'Complete problem sets and upload code documentation.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Class:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{asg.class_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline:
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{asg.due_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-slate-400" /> Submissions:
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {asg.submission_count || 0} received
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">By {asg.teacher_name}</span>
                <button
                  onClick={() => {
                    setActiveTab('submissions');
                    setSearchTerm(asg.title);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View Submissions →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Tab Content */}
      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assignment</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Submitted File</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{sub.student_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{sub.student_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.assignment_title}</div>
                      <div className="text-[11px] text-slate-400">{sub.subject_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{sub.class_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 underline cursor-pointer">
                        {sub.file_name || 'solution.pdf'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          sub.status === 'Graded'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {sub.marks !== undefined ? `${sub.marks} / 100` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeData({
                            marks: sub.marks || 88,
                            feedback: sub.feedback || 'Well prepared submission.',
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        {sub.status === 'Graded' ? 'Re-Grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-16">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">No submissions found</p>
              <p className="text-xs text-slate-400 mt-1">
                Student submissions will appear here once submitted.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
              Create New Academic Assignment
            </h2>
            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g. Distributed Consensus Implementation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newAssignment.subject_name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, subject_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Class
                  </label>
                  <select
                    value={newAssignment.class_name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, class_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Submission Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newAssignment.max_marks}
                    onChange={(e) => setNewAssignment({ ...newAssignment, max_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={3}
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                  placeholder="Outline requirements, submission format, and grading rubric..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
              Grade Student Submission
            </h2>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1.5">
              <div><strong className="text-slate-900 dark:text-white">Student:</strong> {gradingSubmission.student_name} ({gradingSubmission.student_id})</div>
              <div><strong className="text-slate-900 dark:text-white">Assignment:</strong> {gradingSubmission.assignment_title}</div>
              <div><strong className="text-slate-900 dark:text-white">Submitted File:</strong> {gradingSubmission.file_name}</div>
              {gradingSubmission.submission_text && (
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 italic">
                  "{gradingSubmission.submission_text}"
                </div>
              )}
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Marks Awarded (out of 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeData.marks}
                  onChange={(e) => setGradeData({ ...gradeData, marks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instructor Feedback & Comments
                </label>
                <textarea
                  rows={3}
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  placeholder="Provide constructive feedback for the student..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Submit Grade & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
