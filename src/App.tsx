import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { EventsView } from './components/EventsView';
import { AchievementsView } from './components/AchievementsView';
import { HousesView } from './components/HousesView';
import { ReportsView } from './components/ReportsView';
import { AIInsightsView } from './components/AIInsightsView';
import { SettingsView } from './components/SettingsView';
import { ProfileModal } from './components/ProfileModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ToastContainer, ToastData } from './components/Toast';
import { LoginView } from './components/LoginView';
import { UserManagementView } from './components/UserManagementView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { StudentParticipationView } from './components/StudentParticipationView';
import { StudentProfileView } from './components/StudentProfileView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { TeachersManagementView } from './components/TeachersManagementView';
import { AcademicStructureView } from './components/AcademicStructureView';
import { GradebookView } from './components/GradebookView';
import { AssignmentsView } from './components/AssignmentsView';
import { StudentResultsView } from './components/StudentResultsView';
import { StudentAssignmentsView } from './components/StudentAssignmentsView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { CalendarView } from './components/CalendarView';
import { TimetableManagementView } from './components/TimetableManagementView';
import { useAuth } from './context/AuthContext';
import { ComporaLogo, ComporaIcon } from './components/ComporaLogo';
import {
  Student,
  CollegeEvent,
  Achievement,
  EventParticipation,
  NotificationItem,
  ThemeMode,
  NotificationPreferences,
  Teacher,
  AcademicClass,
  Subject,
  Announcement,
  StudentResult,
  Assignment,
  AssignmentSubmission,
  CalendarEvent,
  TimetableEntry,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_EVENTS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_PARTICIPATION,
} from './data/initialData';
import {
  getLocalStudents,
  saveLocalStudents,
  getLocalTeachers,
  saveLocalTeachers,
  getLocalClasses,
  getLocalSubjects,
  getLocalResults,
  saveLocalResults,
  getLocalAssignments,
  getLocalSubmissions,
  getLocalEvents,
  getLocalAchievements,
  getLocalParticipations,
  getLocalAnnouncements,
  getLocalCalendarEvents,
  getLocalTimetable,
} from './utils/localDB';
import {
  calculateHouseStats,
  calculateDepartmentStats,
  calculateYearStats,
} from './utils/stats';
import { getStoredTheme, applyTheme, subscribeToSystemTheme } from './utils/theme';
import { getNotificationPreferences, saveNotificationPreferences } from './utils/notificationPrefs';

export default function App() {
  const { currentUser, loading: authLoading, linkedStudent, linkedTeacher, authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Responsive mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Global Search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Theme Management
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    const darkActive = applyTheme(mode);
    setIsDarkMode(darkActive);
  };

  const toggleDarkMode = () => {
    const nextMode: ThemeMode = isDarkMode ? 'light' : 'dark';
    handleSetThemeMode(nextMode);
  };

  useEffect(() => {
    const darkActive = applyTheme(themeMode);
    setIsDarkMode(darkActive);
    const unsubscribe = subscribeToSystemTheme((dark) => {
      setIsDarkMode(dark);
    });
    return unsubscribe;
  }, [themeMode]);

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    getNotificationPreferences
  );

  const handleUpdateNotificationPrefs = (prefs: NotificationPreferences) => {
    setNotificationPrefs(prefs);
    saveNotificationPreferences(prefs);
    addToast('Notification preferences updated.', 'info');
  };

  // Core Data Collections (Initialized with local verified datasets)
  const [students, setStudents] = useState<Student[]>(getLocalStudents);
  const [events, setEvents] = useState<CollegeEvent[]>(getLocalEvents);
  const [achievements, setAchievements] = useState<Achievement[]>(getLocalAchievements);
  const [participations, setParticipations] = useState<EventParticipation[]>(getLocalParticipations);
  const [teachers, setTeachers] = useState<Teacher[]>(getLocalTeachers);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>(getLocalClasses);
  const [subjects, setSubjects] = useState<Subject[]>(getLocalSubjects);
  const [announcements, setAnnouncements] = useState<Announcement[]>(getLocalAnnouncements);
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [results, setResults] = useState<StudentResult[]>(getLocalResults);
  const [assignments, setAssignments] = useState<Assignment[]>(getLocalAssignments);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(getLocalSubmissions);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(getLocalCalendarEvents);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(getLocalTimetable);

  // Selected Student Profile Modal
  const [selectedStudentModal, setSelectedStudentModal] = useState<Student | null>(null);

  // Pre-selected student ID for AI insights
  const [aiStudentTargetId, setAiStudentTargetId] = useState<string>('');

  // Toast System
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    title?: string
  ) => {
    if (!notificationPrefs.enabled && type !== 'error') {
      return; // Respect user preferences
    }
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastData = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Connected Notification System
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'event_reminder',
      title: 'Upcoming Event: COMPORA National Hackathon',
      message: 'Starts this Saturday in the Main Campus Auditorium. 12 teams enrolled.',
      timestamp: '2h ago',
      read: false,
      targetTab: 'events',
    },
    {
      id: 'notif-2',
      type: 'achievement_created',
      title: 'National Honor Verified',
      message: 'Priya Sharma (CSE) logged 1st Prize at National AI Hackathon (+40 pts for Blue House).',
      timestamp: '4h ago',
      read: false,
      targetTab: 'achievements',
    },
    {
      id: 'notif-3',
      type: 'house_rank_update',
      title: 'House Championship Standing',
      message: 'Blue House leads championship with 240 pts, closely followed by Red House (205 pts).',
      timestamp: '1d ago',
      read: true,
      targetTab: 'houses',
    },
    {
      id: 'notif-4',
      type: 'system_announcement',
      title: 'Spring 2026 Session Active',
      message: 'Role-Based Authentication & Permissions enabled in COMPORA core ledger.',
      timestamp: '2d ago',
      read: true,
      targetTab: 'dashboard',
    },
  ]);

  // Synchronize Browser Page Title
  useEffect(() => {
    if (!currentUser) {
      document.title = 'COMPORA — Connect • Learn • Grow';
      return;
    }

    const tabTitleMap: Record<string, string> = {
      dashboard:
        currentUser.role === 'ADMIN'
          ? 'Admin Dashboard'
          : currentUser.role === 'TEACHER'
          ? 'Teacher Dashboard'
          : 'Student Dashboard',
      students: 'Students Directory',
      teachers: 'Faculty Management',
      academic_structure: 'Academic Structure',
      gradebook: 'Gradebook & Marks',
      assignments: 'Assignments Portal',
      student_assignments: 'My Assignments',
      results: 'Academic Results & CGPA',
      events: 'Campus Events',
      achievements: 'Student Honors & Achievements',
      houses: 'House Championship',
      calendar: 'Academic Calendar',
      timetable: 'Timetable & Schedule',
      announcements: 'Campus Announcements',
      reports: 'Institutional Reports & Audit',
      ai: 'Neural Analytics',
      users: 'User Accounts & Access',
      settings: 'System Settings',
      my_participation: 'My Event Activity',
      my_profile: 'Institutional Profile',
    };

    const sectionTitle = tabTitleMap[activeTab] || 'Campus Portal';
    document.title = `COMPORA — ${sectionTitle}`;
  }, [currentUser, activeTab]);

  const addNotification = (
    type: NotificationItem['type'],
    title: string,
    message: string,
    targetTab?: NotificationItem['targetTab']
  ) => {
    if (!notificationPrefs.enabled) return;
    if (type === 'event_created' && !notificationPrefs.events) return;
    if (type === 'achievement_created' && !notificationPrefs.achievements) return;
    if (type === 'event_reminder' && !notificationPrefs.reminders) return;

    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      targetTab,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('All notifications marked as read.', 'info');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    addToast('Notification panel cleared.', 'info');
  };

  // Fetch live state from backend
  const refreshData = async () => {
    setDataLoading(true);
    try {
      const [dataRes, teachersRes, classesRes, subjectsRes, annRes, calRes, ttRes] = await Promise.all([
        authFetch('/api/data'),
        authFetch('/api/teachers'),
        authFetch('/api/classes'),
        authFetch('/api/subjects'),
        authFetch('/api/announcements'),
        authFetch('/api/calendar'),
        authFetch('/api/timetable'),
      ]);

      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.students && data.events) {
          setStudents(data.students || []);
          setEvents(data.events || []);
          setAchievements(data.achievements || []);
          setParticipations(data.participations || []);
          if (data.results) setResults(data.results);
          if (data.assignments) setAssignments(data.assignments);
          if (data.submissions) setSubmissions(data.submissions);
          if (data.teachers) setTeachers(data.teachers);
          if (data.academic_classes) setAcademicClasses(data.academic_classes);
          if (data.subjects) setSubjects(data.subjects);
          if (data.announcements) setAnnouncements(data.announcements);
        }
      }

      if (teachersRes && teachersRes.ok) {
        const tData = await teachersRes.json();
        setTeachers(tData);
      }

      if (classesRes && classesRes.ok) {
        const cData = await classesRes.json();
        setAcademicClasses(cData);
      }

      if (subjectsRes && subjectsRes.ok) {
        const sData = await subjectsRes.json();
        setSubjects(sData);
      }

      if (annRes && annRes.ok) {
        const aData = await annRes.json();
        setAnnouncements(aData);
      }

      if (calRes && calRes.ok) {
        const calData = await calRes.json();
        setCalendarEvents(calData);
      }

      if (ttRes && ttRes.ok) {
        const ttData = await ttRes.json();
        setTimetableEntries(ttData);
      }

      if (currentUser?.role === 'TEACHER') {
        const meRes = await authFetch('/api/teachers/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setTeacherProfile(meData);
        }
      }
    } catch (e) {
      console.warn('API sync fallback to local store:', e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  // Role Navigation Guard: Redirect if non-authorized tab is accessed
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;

    if (role === 'STUDENT') {
      const studentAllowed = [
        'dashboard',
        'calendar',
        'timetable',
        'student_profile',
        'student_results',
        'student_assignments',
        'events',
        'student_participation',
        'student_achievements',
        'houses',
        'announcements',
        'settings',
      ];
      if (!studentAllowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (role === 'TEACHER') {
      const teacherForbidden = ['teachers', 'academic_structure', 'users', 'reports'];
      if (teacherForbidden.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  // Compute live aggregates across the dataset
  const houseStats = useMemo(
    () => calculateHouseStats(students, achievements, participations),
    [students, achievements, participations]
  );

  const deptStats = useMemo(
    () => calculateDepartmentStats(students, achievements, participations),
    [students, achievements, participations]
  );

  const yearStats = useMemo(
    () => calculateYearStats(students, achievements, participations),
    [students, achievements, participations]
  );

  // Fallback student object if linkedStudent is null
  const effectiveStudent: Student = useMemo(() => {
    if (linkedStudent) return linkedStudent;
    if (currentUser?.student_id) {
      const found = students.find(
        (s) => s.student_id.toLowerCase() === currentUser.student_id?.toLowerCase()
      );
      if (found) return found;
    }
    if (currentUser?.username) {
      const found = students.find(
        (s) => s.student_id.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (found) return found;
    }
    if (students.length > 0) return students[0];
    return {
      id: 'demo-std',
      student_id: '26CSE001',
      name: currentUser?.name || 'Yogakarshika',
      department: 'CSE',
      year: '3rd Year',
      section: 'Section A',
      house: 'Red',
      email: currentUser?.email || '26cse001@compora.edu',
    };
  }, [linkedStudent, students, currentUser]);

  // Fallback teacher object if teacherProfile is null
  const effectiveTeacher: Teacher | null = useMemo(() => {
    if (teacherProfile) return teacherProfile;
    if (linkedTeacher) return linkedTeacher;
    if (currentUser?.staff_id || currentUser?.teacher_id || currentUser?.username) {
      const queryStaff = (currentUser.staff_id || currentUser.username || '').toLowerCase();
      const queryId = currentUser.teacher_id || '';
      const found = teachers.find(
        (t) =>
          (t.staff_id && t.staff_id.toLowerCase() === queryStaff) ||
          ((t as any).staffId && (t as any).staffId.toLowerCase() === queryStaff) ||
          (t.id && (t.id === queryId || t.id.toLowerCase() === queryStaff)) ||
          (t.email && currentUser.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (found) return found;
    }
    return teachers[0] || null;
  }, [teacherProfile, linkedTeacher, currentUser, teachers]);

  // Students Handlers
  const handleAddStudent = async (newStudent: Omit<Student, 'id'>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can enroll students.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const created = await res.json();
        setStudents((prev) => [created, ...prev]);
        addToast(`Student ${created.name} (${created.student_id}) enrolled in ${created.house} House!`, 'success', 'Student Added');
        return true;
      }

      const err = await res.json();
      addToast(err.error || 'Failed to add student. Ensure roll number is unique.', 'error', 'Validation Error');
      return false;
    } catch (e) {
      addToast('Network error while saving student.', 'error');
      return false;
    }
  };

  const handleEditStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can modify student records.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const updated = await res.json();
        setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
        addToast(`Student record for ${updated.name} updated.`, 'success', 'Student Updated');
        return true;
      }
      addToast('Failed to update student details.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while updating student.', 'error');
      return false;
    }
  };

  const handleDeleteStudent = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/students/${id}`, { method: 'DELETE' });

      if (res.status === 403) {
        addToast('Permission Denied: Only Administrators can delete student records.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const std = students.find((s) => s.id === id);
        setStudents((prev) => prev.filter((s) => s.id !== id));
        if (std) {
          setParticipations((prev) => prev.filter((p) => p.student_id !== std.student_id));
          setAchievements((prev) => prev.filter((a) => a.student_id !== std.student_id));
        }
        addToast(`Removed student record for ${std?.name || 'student'}.`, 'info', 'Record Deleted');
        return true;
      }
      addToast('Failed to delete student.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while deleting student.', 'error');
      return false;
    }
  };

  // Events Handlers
  const handleAddEvent = async (newEvent: Omit<CollegeEvent, 'id'>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can publish events.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const created = await res.json();
        setEvents((prev) => [created, ...prev]);
        addToast(`Event "${created.name}" published to college schedule!`, 'success', 'Event Created');
        addNotification(
          'event_created',
          'New College Event Scheduled',
          `"${created.name}" hosted by ${created.department} department on ${created.date}.`,
          'events'
        );
        return true;
      }
      addToast('Failed to schedule event. Check all fields.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while scheduling event.', 'error');
      return false;
    }
  };

  const handleEditEvent = async (id: string, updates: Partial<CollegeEvent>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can update events.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        addToast(`Event "${updated.name}" details updated.`, 'success', 'Event Updated');
        return true;
      }
      addToast('Failed to update event.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while updating event.', 'error');
      return false;
    }
  };

  const handleDeleteEvent = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/events/${id}`, { method: 'DELETE' });

      if (res.status === 403) {
        addToast('Permission Denied: Only Administrators can cancel college events.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const evt = events.find((e) => e.id === id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setParticipations((prev) => prev.filter((p) => p.event_id !== id));
        addToast(`Event "${evt?.name || 'Event'}" removed.`, 'info', 'Event Removed');
        return true;
      }
      addToast('Failed to remove event.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while removing event.', 'error');
      return false;
    }
  };

  // Participant Management Handler
  const handleSaveParticipants = async (
    eventId: string,
    studentIds: string[]
  ): Promise<boolean> => {
    const targetEvent = events.find((e) => e.id === eventId);
    try {
      const res = await authFetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: studentIds }),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can register participants.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        setParticipations((prev) => [
          ...prev.filter((p) => p.event_id !== eventId),
          ...data.participants,
        ]);
        addToast(
          `Registered ${data.count} students for "${targetEvent?.name}". +5 pts awarded per student house!`,
          'success',
          'Participation Saved'
        );
        addNotification(
          'participation_updated',
          'Event Participation Updated',
          `${data.count} participants confirmed for "${targetEvent?.name}". House scores updated.`,
          'events'
        );
        return true;
      }
      addToast('Failed to save participants.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while saving participants.', 'error');
      return false;
    }
  };

  // Achievements Handlers
  const handleAddAchievement = async (
    newAch: Omit<Achievement, 'id'>
  ): Promise<boolean> => {
    const recipient = students.find((s) => s.student_id === newAch.student_id);
    try {
      const res = await authFetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAch),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can certify student honors.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const created = await res.json();
        setAchievements((prev) => [created, ...prev]);
        addToast(
          `Achievement logged for ${recipient?.name || created.student_id}! Points credited to ${recipient?.house || 'House'}.`,
          'success',
          'Honor Recorded'
        );
        addNotification(
          'achievement_created',
          'New Achievement Recorded',
          `${recipient?.name || 'Student'} recorded ${created.level} level award in ${created.category}.`,
          'achievements'
        );
        return true;
      }
      addToast('Failed to record achievement.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while recording achievement.', 'error');
      return false;
    }
  };

  const handleEditAchievement = async (
    id: string,
    updates: Partial<Achievement>
  ): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/achievements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.status === 403) {
        addToast('Permission Denied: Only Faculty and Administrators can edit honors.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        const updated = await res.json();
        setAchievements((prev) => prev.map((a) => (a.id === id ? updated : a)));
        addToast('Achievement record updated.', 'success', 'Achievement Updated');
        addNotification(
          'achievement_updated',
          'Achievement Details Updated',
          `Record "${updated.title}" updated. Points recalculated.`,
          'achievements'
        );
        return true;
      }
      addToast('Failed to update achievement.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while updating achievement.', 'error');
      return false;
    }
  };

  const handleDeleteAchievement = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/achievements/${id}`, { method: 'DELETE' });

      if (res.status === 403) {
        addToast('Permission Denied: Only Administrators can delete verified honors.', 'error', 'Authorization Blocked');
        return false;
      }

      if (res.ok) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
        addToast('Achievement removed and house standings updated.', 'info', 'Honor Removed');
        return true;
      }
      addToast('Failed to remove achievement.', 'error');
      return false;
    } catch (e) {
      addToast('Network error while removing achievement.', 'error');
      return false;
    }
  };

  // Seeder & Reset
  const handleSeedBatch = async (count: number) => {
    try {
      const res = await authFetch('/api/seed-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      if (res.ok) {
        await refreshData();
      } else {
        throw new Error('Batch seed failed');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleResetData = async () => {
    try {
      const res = await authFetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        await refreshData();
      } else {
        throw new Error('Reset failed');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // Quick navigation into AI from student profile
  const handleNavigateToAIWithStudent = (studentId: string) => {
    setAiStudentTargetId(studentId);
    setActiveTab('ai');
  };

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="mb-4 animate-pulse">
          <ComporaLogo variant="full" size="lg" showTagline={true} />
        </div>
        <p className="text-xs text-slate-400 mt-2 max-w-xs">
          Verifying collegiate session and role-based permissions...
        </p>
      </div>
    );
  }

  // If Not Authenticated, show Login View
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={() => refreshData()}
          themeMode={themeMode}
          onToggleTheme={toggleDarkMode}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        houseStats={houseStats}
        studentCount={students.length}
        eventCount={events.length}
        achievementCount={achievements.length}
        onNavigateToAI={() => setActiveTab('ai')}
        onRefresh={refreshData}
        loading={dataLoading}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotificationTab={(tab) => {
          if (tab) setActiveTab(tab);
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenProfile={() => {
          if (role === 'STUDENT') {
            setActiveTab('student_profile');
          } else {
            setIsProfileOpen(true);
          }
        }}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            students: students.length,
            events: events.length,
            achievements: achievements.length,
            teachers: teachers.length,
            calendar: calendarEvents.length,
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* View Container */}
        <main className="flex-1 min-w-0">
          {/* DASHBOARD VIEW: Conditional on Role */}
          {activeTab === 'dashboard' && (
            role === 'STUDENT' ? (
              <StudentDashboardView
                student={effectiveStudent}
                events={events}
                achievements={achievements}
                participations={participations}
                results={results.filter(
                  (r) => r.student_id.toLowerCase() === effectiveStudent.student_id.toLowerCase()
                )}
                assignments={assignments}
                submissions={submissions}
                houseStats={houseStats}
                announcements={announcements}
                onNavigateTab={setActiveTab}
              />
            ) : role === 'TEACHER' ? (
              <TeacherDashboardView
                teacher={effectiveTeacher}
                students={students}
                assignments={assignments}
                submissions={submissions}
                results={results}
                events={events}
                onNavigateTab={setActiveTab}
                onSelectStudent={(st) => setSelectedStudentModal(st)}
              />
            ) : (
              <DashboardView
                students={students}
                events={events}
                achievements={achievements}
                participations={participations}
                houseStats={houseStats}
                deptStats={deptStats}
                yearStats={yearStats}
                teachers={teachers}
                announcements={announcements}
                onNavigate={setActiveTab}
                onSelectStudent={(st) => setSelectedStudentModal(st)}
              />
            )
          )}

          {/* SMART CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <CalendarView
              events={calendarEvents}
              teachers={teachers}
              classes={academicClasses}
              subjects={subjects}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {/* TIMETABLE VIEW */}
          {activeTab === 'timetable' && (
            <TimetableManagementView
              entries={timetableEntries}
              teachers={teachers}
              subjects={subjects}
              classes={academicClasses}
              students={students}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {/* STUDENT-SPECIFIC VIEWS */}
          {activeTab === 'student_profile' && (
            <StudentProfileView
              student={effectiveStudent}
              achievements={achievements}
              participations={participations}
              results={results.filter(
                (r) => r.student_id.toLowerCase() === effectiveStudent.student_id.toLowerCase()
              )}
              events={events}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'student_results' && role === 'STUDENT' && (
            <StudentResultsView
              student={effectiveStudent}
              results={results.filter(
                (r) => r.student_id.toLowerCase() === effectiveStudent.student_id.toLowerCase()
              )}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'student_assignments' && role === 'STUDENT' && (
            <StudentAssignmentsView
              student={effectiveStudent}
              assignments={assignments}
              submissions={submissions}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'student_participation' && (
            <StudentParticipationView
              student={effectiveStudent}
              events={events}
              participations={participations}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'student_achievements' && (
            <AchievementsView
              achievements={achievements.filter(
                (a) => a.student_id.toLowerCase() === effectiveStudent.student_id.toLowerCase()
              )}
              students={students}
              houseStats={houseStats}
              onAddAchievement={handleAddAchievement}
              onEditAchievement={handleEditAchievement}
              onDeleteAchievement={handleDeleteAchievement}
            />
          )}

          {/* TEACHER & ADMIN SHARED ACADEMIC VIEWS */}
          {activeTab === 'gradebook' && (role === 'TEACHER' || role === 'ADMIN') && (
            <GradebookView
              results={results}
              students={students}
              classes={academicClasses}
              subjects={subjects}
              teachers={teachers}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'assignments' && (role === 'TEACHER' || role === 'ADMIN') && (
            <AssignmentsView
              assignments={assignments}
              submissions={submissions}
              classes={academicClasses}
              subjects={subjects}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {/* ADMIN-SPECIFIC INSTITUTIONAL VIEWS */}
          {activeTab === 'teachers' && role === 'ADMIN' && (
            <TeachersManagementView
              teachers={teachers}
              classes={academicClasses}
              subjects={subjects}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'academic_structure' && role === 'ADMIN' && (
            <AcademicStructureView
              classes={academicClasses}
              subjects={subjects}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {/* SHARED CAMPUS ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <AnnouncementsView
              announcements={announcements}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {/* SHARED OR STAFF VIEWS */}
          {activeTab === 'students' && (
            <StudentsView
              students={students}
              achievements={achievements}
              participations={participations}
              events={events}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onRunAIAnalysis={handleNavigateToAIWithStudent}
              selectedStudentModal={selectedStudentModal}
              setSelectedStudentModal={setSelectedStudentModal}
              onRefresh={refreshData}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              events={events}
              students={students}
              participations={participations}
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onSaveParticipants={handleSaveParticipants}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementsView
              achievements={achievements}
              students={students}
              houseStats={houseStats}
              onAddAchievement={handleAddAchievement}
              onEditAchievement={handleEditAchievement}
              onDeleteAchievement={handleDeleteAchievement}
            />
          )}

          {activeTab === 'houses' && (
            <HousesView
              houseStats={houseStats}
              students={students}
              achievements={achievements}
              participations={participations}
              onSelectStudent={(st) => setSelectedStudentModal(st)}
              onNavigateToAI={() => setActiveTab('ai')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              events={events}
              achievements={achievements}
              participations={participations}
              houseStats={houseStats}
              deptStats={deptStats}
              yearStats={yearStats}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'ai' && (
            <AIInsightsView
              students={students}
              events={events}
              achievements={achievements}
              participations={participations}
              houseStats={houseStats}
              preSelectedStudentId={aiStudentTargetId}
            />
          )}

          {/* ADMIN ONLY: USER MANAGEMENT */}
          {activeTab === 'users' && role === 'ADMIN' && (
            <UserManagementView students={students} onAddToast={addToast} />
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <SettingsView
              studentCount={students.length}
              eventCount={events.length}
              achievementCount={achievements.length}
              participationCount={participations.length}
              onSeedBatch={handleSeedBatch}
              onResetData={handleResetData}
              fullDatabase={{
                students,
                events,
                achievements,
                participations,
              }}
              themeMode={themeMode}
              onSetThemeMode={handleSetThemeMode}
              notificationPrefs={notificationPrefs}
              onUpdateNotificationPrefs={handleUpdateNotificationPrefs}
              onAddToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        students={students}
        events={events}
        announcements={announcements}
        teachers={teachers}
        assignments={assignments}
        userRole={role}
        onSelectStudent={(st) => {
          setSelectedStudentModal(st);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Staff Admin Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onNavigateToTab={(t) => {
          setActiveTab(t);
          setIsProfileOpen(false);
        }}
        studentCount={students.length}
        eventCount={events.length}
        achievementCount={achievements.length}
      />

      {/* Modern Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
