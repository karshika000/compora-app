import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Upload,
  AlertCircle,
  FileCheck,
  Award,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { Assignment, AssignmentSubmission, Student } from '../types';
import { useAuth } from '../context/AuthContext';

interface StudentAssignmentsViewProps {
  student: Student;
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const StudentAssignmentsView: React.FC<StudentAssignmentsViewProps> = ({
  student,
  assignments = [],
  submissions = [],
  onRefresh = () => {},
  onAddToast,
}) => {
  const safeAssignments = assignments || [];
  const safeSubmissions = submissions || [];
  const { authFetch } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');

  // Submit Modal
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submitForm, setSubmitForm] = useState({
    submission_text: '',
    file_name: 'solution_code.zip',
  });

  const studentClass = `${student.year} ${student.department} ${student.section}`;

  // Filter assignments matching student class or general
  const classAssignments = safeAssignments.filter((a) => {
    return !a.class_name || a.class_name.includes(student.department) || a.class_name === studentClass;
  });

  const getSubmissionFor = (assignmentId: string) => {
    return safeSubmissions.find((s) => s.assignment_id === assignmentId && s.student_id === student.student_id);
  };

  const filteredAssignments = classAssignments.filter((a) => {
    const sub = getSubmissionFor(a.id);
    if (filter === 'PENDING') return !sub;
    if (filter === 'SUBMITTED') return !!sub;
    return true;
  });

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    try {
      const res = await authFetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: submittingAssignment.id,
          submission_text: submitForm.submission_text,
          file_name: submitForm.file_name,
        }),
      });

      if (res.ok) {
        onAddToast(`Submitted assignment: ${submittingAssignment.title}`, 'success', 'Assignment Submitted');
        setSubmittingAssignment(null);
        setSubmitForm({ submission_text: '', file_name: 'solution_code.zip' });
        onRefresh();
      } else {
        const err = await res.json();
        onAddToast(err.error || 'Failed to submit assignment', 'error');
      }
    } catch {
      onAddToast('Network error during submission', 'error');
    }
  };

  return (
    <div id="student-assignments-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Coursework & Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track class assignments, upload your coursework, and view faculty evaluation remarks.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({classAssignments.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'PENDING'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === 'SUBMITTED'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Submitted
          </button>
        </div>
      </div>

      {/* Assignments Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map((asg) => {
          const sub = getSubmissionFor(asg.id);
          const isSubmitted = !!sub;
          const isGraded = sub?.status === 'Graded';

          return (
            <div
              key={asg.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:shadow-xs transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {asg.subject_name}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1.5">
                      {asg.title}
                    </h3>
                  </div>

                  {isGraded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <Award className="w-3.5 h-3.5" /> Graded ({sub.marks}/{asg.max_marks})
                    </span>
                  ) : isSubmitted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {asg.description || asg.instructions || 'Review the assignment instructions and submit your finalized solutions.'}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Due: <strong className="text-slate-800 dark:text-slate-200">{asg.due_date}</strong>
                  </span>
                  <span className="text-[11px] font-mono">Max Marks: {asg.max_marks}</span>
                </div>

                {/* Feedback Box if Graded */}
                {isGraded && sub?.feedback && (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300">
                      <MessageSquare className="w-3.5 h-3.5" /> Instructor Evaluation:
                    </div>
                    <p className="text-purple-700 dark:text-purple-400 italic">"{sub.feedback}"</p>
                  </div>
                )}
              </div>

              {/* Action Bottom */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Instructor: {asg.teacher_name}</span>
                {!isSubmitted ? (
                  <button
                    onClick={() => {
                      setSubmittingAssignment(asg);
                      setSubmitForm({ submission_text: '', file_name: `${asg.title.replace(/\s+/g, '_')}_solution.pdf` });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> Submit Work
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    File: {sub.file_name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">No assignments found</p>
          <p className="text-xs text-slate-400 mt-1">
            You're all caught up on coursework! Check back later for new problem sets.
          </p>
        </div>
      )}

      {/* Submit Work Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
              Submit Coursework
            </h2>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div><strong className="text-slate-900 dark:text-white">Assignment:</strong> {submittingAssignment.title}</div>
              <div><strong className="text-slate-900 dark:text-white">Subject:</strong> {submittingAssignment.subject_name}</div>
            </div>

            <form onSubmit={handleSubmitSolution} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attachment File Name *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={submitForm.file_name}
                    onChange={(e) => setSubmitForm({ ...submitForm, file_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Submission Notes / Repository Link
                </label>
                <textarea
                  rows={3}
                  value={submitForm.submission_text}
                  onChange={(e) => setSubmitForm({ ...submitForm, submission_text: e.target.value })}
                  placeholder="Provide repository URL, notes on your algorithm, or test cases summary..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
