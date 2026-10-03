import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Award,
  Calendar,
  X,
  UserCheck,
  GraduationCap,
  AlertCircle,
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  FileText,
  Check,
  HelpCircle,
  Info,
  Layers,
} from 'lucide-react';
import {
  Student,
  Achievement,
  EventParticipation,
  CollegeEvent,
  HouseName,
  DepartmentName,
  AcademicYear,
} from '../types';
import {
  DEPARTMENTS,
  ACADEMIC_YEARS,
  HOUSES,
  calculateAchievementPoints,
} from '../utils/stats';
import { POINT_SYSTEM } from '../data/initialData';
import { HOUSE_THEMES, getHouseTheme } from '../utils/houseTheme';
import { useAuth } from '../context/AuthContext';

interface StudentsViewProps {
  students: Student[];
  achievements: Achievement[];
  participations: EventParticipation[];
  events: CollegeEvent[];
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<boolean>;
  onEditStudent: (id: string, updates: Partial<Student>) => Promise<boolean>;
  onDeleteStudent: (id: string) => Promise<boolean>;
  onRunAIAnalysis: (studentId: string) => void;
  selectedStudentModal: Student | null;
  setSelectedStudentModal: (student: Student | null) => void;
  onRefresh?: () => void;
  onAddToast?: (msg: string, type?: any, title?: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students = [],
  achievements = [],
  participations = [],
  events = [],
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onRunAIAnalysis,
  selectedStudentModal,
  setSelectedStudentModal,
  onRefresh,
  onAddToast,
}) => {
  const { authFetch } = useAuth();
  const safeStudents = students || [];
  const safeAchievements = achievements || [];
  const safeParticipations = participations || [];
  const safeEvents = events || [];

  // Filters & Search
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [houseFilter, setHouseFilter] = useState<string>('All');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    department: 'CSE' as DepartmentName,
    year: '1st Year' as AcademicYear,
    section: 'Section A',
    house: 'Red' as HouseName,
    date_of_birth: '',
    email: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return safeStudents.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'All' || s.department === deptFilter;
      const matchYear = yearFilter === 'All' || s.year === yearFilter;
      const matchHouse = houseFilter === 'All' || s.house === houseFilter;

      return matchSearch && matchDept && matchYear && matchHouse;
    });
  }, [safeStudents, search, deptFilter, yearFilter, houseFilter]);

  const handleOpenAdd = () => {
    setFormData({
      student_id: '',
      name: '',
      department: 'CSE',
      year: '1st Year',
      section: 'Section A',
      house: 'Red',
      date_of_birth: '',
      email: '',
      phone: '',
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFormData({
      student_id: st.student_id,
      name: st.name,
      department: st.department,
      year: st.year,
      section: st.section,
      house: st.house,
      date_of_birth: st.date_of_birth || '',
      email: st.email || '',
      phone: st.phone || '',
    });
    setFormError('');
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id.trim() || !formData.name.trim()) {
      setFormError('Student Registration ID and Full Name are required.');
      return;
    }

    if (!formData.date_of_birth) {
      setFormError('Date of Birth is required.');
      return;
    }

    // Validate DOB format and bounds
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
    if (age < 14 || age > 75) {
      setFormError('Student must be of a reasonable college age (14-75 years).');
      return;
    }

    setSubmitting(true);
    const success = await onAddStudent(formData);
    setSubmitting(false);

    if (success) {
      setIsAddOpen(false);
    } else {
      setFormError('Failed to create student. Check duplicate ID.');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

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
      if (age < 14 || age > 75) {
        setFormError('Student must be of a reasonable college age (14-75 years).');
        return;
      }
    }

    setSubmitting(true);
    const success = await onEditStudent(editingStudent.id, formData);
    setSubmitting(false);

    if (success) {
      setEditingStudent(null);
    } else {
      setFormError('Failed to update student.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setSubmitting(true);
    await onDeleteStudent(deletingStudent.id);
    setSubmitting(false);
    setDeletingStudent(null);
  };

  // Helper for splitting a CSV line respecting quotation marks
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  // Live CSV Parser and Validator for bulk upload
  const previewData = useMemo(() => {
    if (!importCsvText.trim()) return null;
    const lines = importCsvText
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;

    const firstLineCols = parseCsvLine(lines[0]);
    const lowerFirst = firstLineCols.map((c) => c.toLowerCase().replace(/[^a-z0-9_]/g, ''));

    const isHeader = lowerFirst.some(
      (c) =>
        c.includes('student') ||
        c.includes('reg') ||
        c.includes('roll') ||
        c.includes('name') ||
        c.includes('dept') ||
        c.includes('dob') ||
        c.includes('birth')
    );

    const headerMap: { [key: string]: number } = {};
    let dataLines = lines;

    if (isHeader) {
      lowerFirst.forEach((col, idx) => {
        if (col.includes('student') || col.includes('reg') || col.includes('roll') || col === 'id') {
          headerMap['student_id'] = idx;
        } else if (col.includes('name')) {
          headerMap['name'] = idx;
        } else if (col.includes('dept') || col.includes('branch')) {
          headerMap['department'] = idx;
        } else if (col.includes('year')) {
          headerMap['year'] = idx;
        } else if (col.includes('sec')) {
          headerMap['section'] = idx;
        } else if (col.includes('house')) {
          headerMap['house'] = idx;
        } else if (col.includes('dob') || col.includes('birth')) {
          headerMap['date_of_birth'] = idx;
        } else if (col.includes('email')) {
          headerMap['email'] = idx;
        } else if (col.includes('phone') || col.includes('mobile')) {
          headerMap['phone'] = idx;
        }
      });
      dataLines = lines.slice(1);
    } else {
      headerMap['student_id'] = 0;
      headerMap['name'] = 1;
      headerMap['department'] = 2;
      headerMap['year'] = 3;
      headerMap['section'] = 4;
      headerMap['house'] = 5;
      headerMap['date_of_birth'] = 6;
    }

    const seenIds = new Set<string>();

    const rows = dataLines.map((line, lineIdx) => {
      const cols = parseCsvLine(line);
      const student_id =
        headerMap['student_id'] !== undefined ? cols[headerMap['student_id']] || '' : cols[0] || '';
      const name = headerMap['name'] !== undefined ? cols[headerMap['name']] || '' : cols[1] || '';
      const department =
        headerMap['department'] !== undefined ? cols[headerMap['department']] || '' : cols[2] || '';
      const year = headerMap['year'] !== undefined ? cols[headerMap['year']] || '' : cols[3] || '1st Year';
      const section =
        headerMap['section'] !== undefined ? cols[headerMap['section']] || '' : cols[4] || 'Section A';
      const house = headerMap['house'] !== undefined ? cols[headerMap['house']] || '' : cols[5] || 'Red';
      const date_of_birth =
        headerMap['date_of_birth'] !== undefined ? cols[headerMap['date_of_birth']] || '' : cols[6] || '';
      const email = headerMap['email'] !== undefined ? cols[headerMap['email']] || '' : '';
      const phone = headerMap['phone'] !== undefined ? cols[headerMap['phone']] || '' : '';

      const cleanId = student_id.trim().toUpperCase();
      const cleanDept = department.trim();
      const cleanName = name.trim();

      const errors: string[] = [];
      // Mandatory validations
      if (!cleanId) errors.push('Missing student_id (Mandatory)');
      if (!cleanName) errors.push('Missing name (Mandatory)');
      if (!cleanDept) errors.push('Missing department (Mandatory)');

      if (cleanId && seenIds.has(cleanId)) {
        errors.push(`Duplicate ID in CSV: ${cleanId}`);
      }
      if (cleanId && safeStudents.some((s) => s.student_id.toLowerCase() === cleanId.toLowerCase())) {
        errors.push(`Student ID ${cleanId} already enrolled`);
      }
      if (cleanId) seenIds.add(cleanId);

      return {
        rowIndex: lineIdx + (isHeader ? 2 : 1),
        student_id: cleanId,
        name: cleanName,
        department: cleanDept,
        year: year.trim() || '1st Year',
        section: section.trim() || 'Section A',
        house: house.trim() || 'Red',
        date_of_birth: date_of_birth.trim(),
        email: email.trim(),
        phone: phone.trim(),
        isValid: errors.length === 0,
        errors,
      };
    });

    const validCount = rows.filter((r) => r.isValid).length;
    const invalidCount = rows.length - validCount;

    return { isHeader, rows, validCount, invalidCount, totalRows: rows.length };
  }, [importCsvText, safeStudents]);

  // Download CSV Starter Template
  const handleDownloadCsvTemplate = () => {
    const template = `student_id,name,department,year,section,house,date_of_birth,email,phone
26CSE051,Aravind Sundar,CSE,1st Year,Section A,Red,2005-06-15,26cse051@compora.edu,+91 98401 11223
26IT052,Meera Krishnan,IT,2nd Year,Section B,Blue,2004-11-20,26it052@compora.edu,+91 98402 22334
26AIDS053,Rahul Nambiar,AI&DS,3rd Year,Section A,Green,2003-08-10,26aids053@compora.edu,+91 98403 33445
26ECE054,Sneha Murali,ECE,1st Year,Section C,Yellow,2005-09-25,26ece054@compora.edu,+91 98404 44556`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'compora_students_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onAddToast) onAddToast('Starter CSV template downloaded.', 'info', 'CSV Template Ready');
  };

  // CSV Dataset Import Handler
  const handleSubmitImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData || previewData.rows.length === 0) {
      setFormError('Please provide CSV content or paste valid data.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setImportResult(null);

    try {
      const parsedStudents = previewData.rows.map((r) => ({
        student_id: r.student_id,
        name: r.name,
        department: r.department,
        year: r.year,
        section: r.section,
        house: r.house,
        date_of_birth: r.date_of_birth,
        email: r.email,
        phone: r.phone,
      }));

      const res = await authFetch('/api/students/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: parsedStudents }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        if (onAddToast) {
          onAddToast(
            `Imported ${data.successCount} students successfully! (${data.failedCount} failed validation)`,
            data.failedCount > 0 ? 'warning' : 'success',
            'Bulk Import Completed'
          );
        }
        if (onRefresh) onRefresh();
      } else {
        setFormError(data.error || 'Failed to process student CSV upload.');
      }
    } catch {
      setFormError('Network error uploading CSV dataset.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get student point totals
  const getStudentStats = (studentId: string) => {
    const studentAchs = achievements.filter((a) => a.student_id === studentId);
    const studentParts = participations.filter((p) => p.student_id === studentId);

    const achPoints = studentAchs.reduce(
      (sum, a) => sum + calculateAchievementPoints(a.level),
      0
    );
    const partPoints = studentParts.length * POINT_SYSTEM.participation;

    return {
      achPoints,
      partPoints,
      totalPoints: achPoints + partPoints,
      achievements: studentAchs,
      participations: studentParts,
    };
  };

  const resetFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setYearFilter('All');
    setHouseFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Module 02
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Student Activity Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive roster across 9 departments, 4 academic years, sections, and House memberships.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setImportCsvText('');
              setImportResult(null);
              setFormError('');
              setIsImportOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import Dataset (.csv)</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or roll ID (e.g. 21CS001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Academic Years</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* House Filter */}
        <div>
          <select
            value={houseFilter}
            onChange={(e) => setHouseFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Houses</option>
            {HOUSES.map((h) => (
              <option key={h} value={h}>
                {h} House
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filteredStudents.length} of {students.length} students
          </span>
          {(search || deptFilter !== 'All' || yearFilter !== 'All' || houseFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">House</th>
                <th className="py-3.5 px-4">Date of Birth</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        No students found
                      </p>
                      <p className="text-xs text-slate-400">
                        No student records match the active search or filters.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const stats = getStudentStats(st.student_id);
                  const theme = getHouseTheme(st.house);

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition group cursor-pointer"
                      onClick={() => setSelectedStudentModal(st)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {st.student_id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {st.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {st.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{st.year}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-500">{st.section}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                          {st.house} House
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {st.date_of_birth ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            {new Date(st.date_of_birth + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                          {stats.totalPoints} pts
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedStudentModal(st)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                          title="View Profile & AI Analysis"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(st)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile / Detail Modal */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedStudentModal(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const stats = getStudentStats(selectedStudentModal.student_id);
              const theme = getHouseTheme(selectedStudentModal.house);

              return (
                <div className="space-y-6">
                  {/* Top Profile Header */}
                  <div className="flex items-start gap-4 pr-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center font-display shadow-md shrink-0">
                      {selectedStudentModal.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                          {selectedStudentModal.name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badgeBorder} ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          {selectedStudentModal.house} House
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedStudentModal.student_id}</span> • {selectedStudentModal.department} • {selectedStudentModal.year} • {selectedStudentModal.section}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          DOB: {selectedStudentModal.date_of_birth ? new Date(selectedStudentModal.date_of_birth + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not specified'}
                        </span>
                        {selectedStudentModal.email && (
                          <span>• {selectedStudentModal.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Activity Score Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Total House Points
                      </div>
                      <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-display mt-0.5">
                        {stats.totalPoints}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Achievements ({stats.achievements.length})
                      </div>
                      <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display mt-0.5">
                        {stats.achPoints} pts
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Participations ({stats.participations.length})
                      </div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display mt-0.5">
                        {stats.partPoints} pts
                      </div>
                    </div>
                  </div>

                  {/* AI Quick Evaluation Action */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>AI Performance & Growth Analysis</span>
                      </div>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                        Synthesize verified records into activity quotient, strengths & event recommendations.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const sid = selectedStudentModal.student_id;
                        setSelectedStudentModal(null);
                        onRunAIAnalysis(sid);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition shrink-0 ml-3"
                    >
                      Run AI
                    </button>
                  </div>

                  {/* Participations List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Registered Events ({stats.participations.length})
                    </h4>
                    {stats.participations.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        No event participations recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {stats.participations.map((part) => {
                          const event = events.find((e) => e.id === part.event_id);
                          return (
                            <div
                              key={part.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {event?.name || 'Event'}
                              </span>
                              <span className="text-slate-400 font-mono">
                                {event?.date || '2026'} (+5 pts)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Achievements List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Verified Achievements ({stats.achievements.length})
                    </h4>
                    {stats.achievements.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        No awards recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {stats.achievements.map((ach) => (
                          <div
                            key={ach.id}
                            className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-amber-900 dark:text-amber-300">
                                {ach.title}
                              </div>
                              <div className="text-[11px] text-amber-700 dark:text-amber-400">
                                {ach.category} • {ach.level} Tier
                              </div>
                            </div>
                            <span className="font-black text-amber-800 dark:text-amber-300 font-mono">
                              +{calculateAchievementPoints(ach.level)} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Enroll New Student
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number / Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 23CS042"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentName })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value as AcademicYear })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    House Allocation
                  </label>
                  <select
                    value={formData.house}
                    onChange={(e) => setFormData({ ...formData, house: e.target.value as HouseName })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {HOUSES.map((h) => (
                      <option key={h} value={h}>
                        {h} House
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    min="1950-01-01"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Used to generate initial login password (first 4 letters @ birth year).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Edit Student: {editingStudent.name}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.student_id}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentName })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value as AcademicYear })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    House
                  </label>
                  <select
                    value={formData.house}
                    onChange={(e) => setFormData({ ...formData, house: e.target.value as HouseName })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {HOUSES.map((h) => (
                      <option key={h} value={h}>
                        {h} House
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    min="1950-01-01"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Updates birth year for default password hash if not yet changed.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Delete Student Record?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deletingStudent.name} ({deletingStudent.student_id})</strong>? This will remove all their participations and achievements.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset CSV Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    Bulk Student Enrollment via CSV
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload or paste student roster datasets with mandatory field validation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mandatory Guidelines & Template Download Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>Mandatory Fields & Column Headers:</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  • <strong className="text-indigo-600 dark:text-indigo-400">student_id</strong> (Unique Reg No, e.g. <code className="font-mono font-bold">26CSE051</code>)<br />
                  • <strong className="text-indigo-600 dark:text-indigo-400">name</strong> (Student Full Name)<br />
                  • <strong className="text-indigo-600 dark:text-indigo-400">department</strong> (e.g. <code className="font-mono">CSE, IT, AI&DS, ECE, MECH</code>)<br />
                  • Optional: <code className="font-mono">year, section, house, date_of_birth, email, phone</code>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Starter Template</span>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-400">Download formatted CSV sample</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV</span>
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Results Alert Banner */}
            {importResult && (
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Enrolled Successfully: {importResult.successCount}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Failed Validation: {importResult.failedCount}
                  </span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px] text-rose-600 dark:text-rose-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {importResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 flex items-start gap-2">
                        <span className="font-bold shrink-0">Row {err.row}</span>
                        {err.student_id && <span className="font-mono bg-rose-100 dark:bg-rose-900/60 px-1 py-0.2 rounded font-bold">{err.student_id}</span>}
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitImportCsv} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Paste or Upload Student CSV Data
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImportCsvText(
                          `student_id,name,department,year,section,house,date_of_birth,email,phone
26CSE061,Anand Vardhan,CSE,1st Year,Section A,Red,2005-04-12,26cse061@compora.edu,+91 98401 55667
26IT062,Divya Ranganathan,IT,2nd Year,Section B,Blue,2004-09-18,26it062@compora.edu,+91 98402 66778
26AIDS063,Manoj Kumar,AI&DS,3rd Year,Section A,Green,2003-12-05,26aids063@compora.edu,+91 98403 77889
26CSBS064,Lavanya S,CSBS,1st Year,Section A,Yellow,2005-07-22,26csbs064@compora.edu,+91 98404 88990`
                        );
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Load Sample CSV
                    </button>
                    {importCsvText && (
                      <button
                        type="button"
                        onClick={() => {
                          setImportCsvText('');
                          setImportResult(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

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
                </div>

                <textarea
                  rows={5}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="student_id,name,department,year,section,house,date_of_birth&#10;26CSE061,Anand Vardhan,CSE,1st Year,Section A,Red,2005-04-12"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Live Preview Table with Validation Flags */}
              {previewData && previewData.rows.length > 0 && (
                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Detected Records Preview ({previewData.totalRows} rows)
                    </span>
                    <div className="flex items-center gap-2 font-bold text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓ {previewData.validCount} Valid
                      </span>
                      {previewData.invalidCount > 0 && (
                        <span className="text-rose-600 dark:text-rose-400">
                          ⚠ {previewData.invalidCount} Needs Attention
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Student ID *</th>
                          <th className="px-3 py-2">Name *</th>
                          <th className="px-3 py-2">Department *</th>
                          <th className="px-3 py-2">DOB</th>
                          <th className="px-3 py-2">Cohort</th>
                          <th className="px-3 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                        {previewData.rows.map((r) => (
                          <tr
                            key={r.rowIndex}
                            className={r.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-rose-50/30 dark:bg-rose-950/20'}
                          >
                            <td className="px-3 py-2 text-slate-400">#{r.rowIndex}</td>
                            <td className="px-3 py-2 font-bold">
                              {r.student_id ? (
                                <span className="text-indigo-600 dark:text-indigo-400">{r.student_id}</span>
                              ) : (
                                <span className="text-rose-500 font-sans italic font-normal">Missing</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-sans font-medium text-slate-900 dark:text-white">
                              {r.name || <span className="text-rose-500 italic font-normal">Missing</span>}
                            </td>
                            <td className="px-3 py-2">
                              {r.department ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">{r.department}</span>
                              ) : (
                                <span className="text-rose-500 italic font-normal">Missing</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                              {r.date_of_birth || '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                              {r.year} • {r.section}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-sans">
                                  <Check className="w-3 h-3" /> Ready
                                </span>
                              ) : (
                                <span
                                  title={r.errors.join(', ')}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full font-sans"
                                >
                                  <AlertCircle className="w-3 h-3" /> {r.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Accounts with derived passwords will be generated automatically.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !importCsvText.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{submitting ? 'Validating & Uploading...' : 'Upload & Enroll Students'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
