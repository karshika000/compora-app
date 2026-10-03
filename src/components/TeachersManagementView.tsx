import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Check,
  Shield,
  Layers,
  Calendar,
  Eye,
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Teacher, AcademicClass, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

interface TeachersManagementViewProps {
  teachers: Teacher[];
  classes: AcademicClass[];
  subjects: Subject[];
  onRefresh: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const TeachersManagementView: React.FC<TeachersManagementViewProps> = ({
  teachers,
  classes,
  subjects,
  onRefresh,
  onAddToast,
}) => {
  const { authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    staff_id: '',
    name: '',
    email: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    phone: '',
    date_of_birth: '',
    assigned_classes: [] as string[],
    assigned_subjects: [] as string[],
    can_publish_events: true,
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  const departments = ['All', 'CSE', 'IT', 'AI&DS', 'CSBS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'BME'];

  const filteredTeachers = teachers.filter((t) => {
    const staffIdStr = t.staff_id || '';
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assigned_subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDept = selectedDept === 'All' || t.department === selectedDept;
    return matchSearch && matchDept;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormError('');
    // Auto calculate next Staff ID (e.g. STF011)
    const count = teachers.length + 1;
    const nextStaffId = `STF${String(count).padStart(3, '0')}`;

    setFormData({
      staff_id: nextStaffId,
      name: '',
      email: '',
      department: 'CSE',
      designation: 'Assistant Professor',
      phone: '',
      date_of_birth: '',
      assigned_classes: ['4th Year CSE A'],
      assigned_subjects: ['Data Structures & Algorithms'],
      can_publish_events: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormError('');
    setFormData({
      staff_id: t.staff_id || t.id.replace('teach-', 'STF00'),
      name: t.name,
      email: t.email,
      department: t.department,
      designation: t.designation,
      phone: t.phone || '',
      date_of_birth: t.date_of_birth || '',
      assigned_classes: [...t.assigned_classes],
      assigned_subjects: [...t.assigned_subjects],
      can_publish_events: t.can_publish_events ?? true,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required.');
      return;
    }

    if (!editingTeacher && !formData.date_of_birth) {
      setFormError('Date of Birth is required.');
      return;
    }

    if (formData.date_of_birth) {
      const dobDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        setFormError('Please enter a valid Date of Birth.');
        return;
      }
      if (dobDate > today) {
        setFormError('Future dates are not allowed for Date of Birth.');
        return;
      }
      const age = (today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 20 || age > 85) {
        setFormError('Faculty member must be of a reasonable age (20-85 years).');
        return;
      }
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingTeacher) {
        const res = await authFetch(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onAddToast(`Updated profile for ${formData.name}`, 'success', 'Teacher Updated');
          setIsAddModalOpen(false);
          onRefresh();
        } else {
          const err = await res.json();
          setFormError(err.error || 'Failed to update teacher.');
        }
      } else {
        const res = await authFetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onAddToast(`Added faculty member ${formData.name}`, 'success', 'Teacher Added');
          setIsAddModalOpen(false);
          onRefresh();
        } else {
          const err = await res.json();
          setFormError(err.error || 'Failed to add teacher.');
        }
      }
    } catch {
      setFormError('Network error processing teacher record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeacher) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/teachers/${deletingTeacher.id}`, { method: 'DELETE' });
      if (res.ok) {
        onAddToast(`Faculty member ${deletingTeacher.name} removed`, 'info', 'Record Deleted');
        setDeletingTeacher(null);
        onRefresh();
      } else {
        onAddToast('Failed to delete teacher record', 'error');
      }
    } catch {
      onAddToast('Network error during deletion', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) {
      setFormError('Please provide CSV content.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setImportResult(null);

    try {
      const lines = importCsvText.trim().split(/\r?\n/);
      let startIdx = 0;
      const firstLine = lines[0].toLowerCase();
      if (
        firstLine.includes('staff_id') ||
        firstLine.includes('name') ||
        firstLine.includes('date_of_birth')
      ) {
        startIdx = 1;
      }

      const parsedTeachers: any[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 3) {
          parsedTeachers.push({
            staff_id: cols[0],
            name: cols[1],
            department: cols[2] || 'CSE',
            date_of_birth: cols[3] || '',
            designation: cols[4] || 'Assistant Professor',
            email: cols[5] || '',
            phone: cols[6] || '',
          });
        }
      }

      if (parsedTeachers.length === 0) {
        setFormError('Could not parse any faculty rows. Please check CSV format.');
        setSubmitting(false);
        return;
      }

      const res = await authFetch('/api/teachers/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers: parsedTeachers }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        onAddToast(
          `Imported ${data.successCount} faculty members! (${data.failedCount} failed validation)`,
          data.failedCount > 0 ? 'warning' : 'success',
          'Faculty Import Completed'
        );
        onRefresh();
      } else {
        setFormError(data.error || 'Failed to process CSV.');
      }
    } catch {
      setFormError('Network error uploading faculty dataset.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleClassAssignment = (clsName: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_classes: prev.assigned_classes.includes(clsName)
        ? prev.assigned_classes.filter((c) => c !== clsName)
        : [...prev.assigned_classes, clsName],
    }));
  };

  const toggleSubjectAssignment = (subName: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_subjects: prev.assigned_subjects.includes(subName)
        ? prev.assigned_subjects.filter((s) => s !== subName)
        : [...prev.assigned_subjects, subName],
    }));
  };

  const formatDisplayDob = (dobStr?: string) => {
    if (!dobStr) return '-';
    try {
      return new Date(dobStr + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dobStr;
    }
  };

  return (
    <div id="teachers-management-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Module 03
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Faculty & Teacher Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage instructors, credentials, complete Date of Birth records, and teaching assignments.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setImportCsvText('');
              setImportResult(null);
              setFormError('');
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import Dataset (.csv)</span>
          </button>
          <button
            id="btn-add-teacher"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-teachers-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by instructor name, Staff ID (e.g. STF001), email, or subject..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedDept === dept
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => {
          const staffIdDisplay = teacher.staff_id || teacher.id.replace('teach-', 'STF00');
          return (
            <div
              key={teacher.id}
              id={`teacher-card-${teacher.id}`}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {teacher.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.5 rounded-md">
                          {staffIdDisplay}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {teacher.designation} • {teacher.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingTeacher(teacher)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(teacher)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Edit Faculty"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTeacher(teacher)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Date of Birth & Contact info */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Date of Birth:</span>
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDisplayDob(teacher.date_of_birth)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Email:</span>
                    </span>
                    <span className="truncate max-w-[170px]">{teacher.email}</span>
                  </div>
                </div>

                {/* Assigned Subjects */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    <span>Assigned Subjects</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.assigned_subjects.length > 0 ? (
                      teacher.assigned_subjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50"
                        >
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                    )}
                  </div>
                </div>

                {/* Assigned Classes */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span>Assigned Classes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.assigned_classes.length > 0 ? (
                      teacher.assigned_classes.map((cls, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {cls}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No classes assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom status badge */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Publish Events:</span>
                </span>
                {teacher.can_publish_events ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" /> Allowed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
                    <XCircle className="w-3.5 h-3.5" /> Disabled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">No faculty members found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new instructor.</p>
        </div>
      )}

      {/* View Teacher Details Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base">
                  {viewingTeacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {viewingTeacher.name}
                  </h3>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {viewingTeacher.staff_id || viewingTeacher.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingTeacher(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Staff / Employee ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {viewingTeacher.staff_id || viewingTeacher.id}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Designation</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.designation}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Date of Birth</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  {viewingTeacher.date_of_birth ? (
                    new Date(viewingTeacher.date_of_birth + 'T00:00:00').toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  ) : (
                    <span className="text-slate-400 italic">Not Provided</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.email}</span>
              </div>
              {viewingTeacher.phone && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingTeacher(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Faculty Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-display">
                {editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : 'Enroll New Faculty Member'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Staff ID / Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value.toUpperCase() })}
                    placeholder="e.g. STF001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-400">Unique login username for faculty</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Arun Kumar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth {editingTeacher ? '' : '*'}
                  </label>
                  <input
                    type="date"
                    required={!editingTeacher}
                    max={new Date().toISOString().split('T')[0]}
                    min="1940-01-01"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">
                    Generates initial password: <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">first4letters@birthyear</code>
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. arun.kumar@compora.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {departments.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor & HOD">Professor & HOD</option>
                    <option value="Professor">Professor</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98405..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              {/* Class Rosters Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Teaching Classes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {classes.map((cls) => {
                    const isSelected = formData.assigned_classes.includes(cls.name);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => toggleClassAssignment(cls.name)}
                        className={`p-2 rounded-lg text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{cls.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Teaching Subjects
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {subjects.map((sub) => {
                    const isSelected = formData.assigned_subjects.includes(sub.name);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => toggleSubjectAssignment(sub.name)}
                        className={`p-2 rounded-lg text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sub.name} ({sub.code})</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Publishing Privileges */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="chk-publish-events"
                  type="checkbox"
                  checked={formData.can_publish_events}
                  onChange={(e) => setFormData({ ...formData, can_publish_events: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="chk-publish-events" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Authorize to publish college events and manage registrations
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Enroll Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Remove Faculty Member?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deletingTeacher.name} ({deletingTeacher.staff_id || deletingTeacher.id})</strong>? Their portal user account will also be disabled.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Removing...' : 'Delete Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Import Faculty Dataset (CSV)
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Import faculty members with complete Date of Birth (YYYY-MM-DD). Initial login accounts will be generated with Username = Staff ID and Password = <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold">first4letters@birthyear</code>.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-mono space-y-1 text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-700 dark:text-slate-200">Expected CSV Schema:</div>
              <div className="text-indigo-600 dark:text-indigo-400">staff_id,name,department,date_of_birth,designation,email,phone</div>
              <div className="text-slate-400">STF001,Arun Kumar,CSE,1985-07-15,Professor,arun@compora.edu,+919840122334</div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {importResult && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Enrolled: {importResult.successCount}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Failed / Rejected: {importResult.failedCount}
                  </span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-rose-600 dark:text-rose-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {importResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="p-1.5 rounded bg-rose-50/50 dark:bg-rose-950/30">
                        Row {err.row} ({err.staff_id || 'Unknown'}): {err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload CSV File or Paste Content
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setImportCsvText(String(event.target?.result || ''));
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImportCsvText(
                        'staff_id,name,department,date_of_birth,designation,email,phone\nSTF011,Dr. Anirudh Sen,CSE,1983-05-20,Professor,anirudh.sen@compora.edu,+919840199881\nSTF012,Prof. Lavanya S,ECE,1991-09-12,Assistant Professor,lavanya.s@compora.edu,+919840199882'
                      );
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-auto"
                  >
                    Load Sample CSV
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="staff_id,name,department,date_of_birth&#10;STF011,Dr. Anirudh Sen,CSE,1983-05-20"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !importCsvText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Validating & Importing...' : 'Validate & Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
