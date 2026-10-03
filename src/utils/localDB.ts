import {
  Student,
  Teacher,
  AcademicClass,
  Subject,
  StudentResult,
  Assignment,
  AssignmentSubmission,
  Announcement,
  CollegeEvent,
  Achievement,
  EventParticipation,
  CalendarEvent,
  TimetableEntry,
  User,
} from '../types';
import { INITIAL_STUDENTS, INITIAL_EVENTS, INITIAL_ACHIEVEMENTS, INITIAL_PARTICIPATION } from '../data/initialData';
import {
  INITIAL_TEACHERS,
  INITIAL_ACADEMIC_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENT_RESULTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_SUBMISSIONS,
  INITIAL_ANNOUNCEMENTS,
} from '../data/portalData';
import { SEED_CALENDAR_EVENTS, SEED_TIMETABLE_ENTRIES } from '../data/seedCalendar';

const STORAGE_KEYS = {
  STUDENTS: 'compora_students_db',
  TEACHERS: 'compora_teachers_db',
  CLASSES: 'compora_classes_db',
  SUBJECTS: 'compora_subjects_db',
  RESULTS: 'compora_results_db',
  ASSIGNMENTS: 'compora_assignments_db',
  SUBMISSIONS: 'compora_submissions_db',
  EVENTS: 'compora_events_db',
  ACHIEVEMENTS: 'compora_achievements_db',
  PARTICIPATIONS: 'compora_participations_db',
  ANNOUNCEMENTS: 'compora_announcements_db',
  CALENDAR: 'compora_calendar_db',
  TIMETABLE: 'compora_timetable_db',
  USERS: 'compora_users_db',
  ACTIVE_SESSION: 'compora_active_session',
};

function getStoredArray<T>(key: string, defaultArray: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultArray;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultArray;
  } catch (e) {
    return defaultArray;
  }
}

function saveArray<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to persist ${key}:`, e);
  }
}

export function getLocalStudents(): Student[] {
  return getStoredArray(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
}

export function saveLocalStudents(students: Student[]): void {
  saveArray(STORAGE_KEYS.STUDENTS, students);
}

export function getLocalTeachers(): Teacher[] {
  return getStoredArray(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
}

export function saveLocalTeachers(teachers: Teacher[]): void {
  saveArray(STORAGE_KEYS.TEACHERS, teachers);
}

export function getLocalClasses(): AcademicClass[] {
  return getStoredArray(STORAGE_KEYS.CLASSES, INITIAL_ACADEMIC_CLASSES);
}

export function getLocalSubjects(): Subject[] {
  return getStoredArray(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
}

export function getLocalResults(): StudentResult[] {
  return getStoredArray(STORAGE_KEYS.RESULTS, INITIAL_STUDENT_RESULTS);
}

export function saveLocalResults(results: StudentResult[]): void {
  saveArray(STORAGE_KEYS.RESULTS, results);
}

export function getLocalAssignments(): Assignment[] {
  return getStoredArray(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
}

export function getLocalSubmissions(): AssignmentSubmission[] {
  return getStoredArray(STORAGE_KEYS.SUBMISSIONS, INITIAL_ASSIGNMENT_SUBMISSIONS);
}

export function getLocalEvents(): CollegeEvent[] {
  return getStoredArray(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export function getLocalAchievements(): Achievement[] {
  return getStoredArray(STORAGE_KEYS.ACHIEVEMENTS, INITIAL_ACHIEVEMENTS);
}

export function getLocalParticipations(): EventParticipation[] {
  return getStoredArray(STORAGE_KEYS.PARTICIPATIONS, INITIAL_PARTICIPATION);
}

export function getLocalAnnouncements(): Announcement[] {
  return getStoredArray(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
}

export function getLocalCalendarEvents(): CalendarEvent[] {
  return getStoredArray(STORAGE_KEYS.CALENDAR, SEED_CALENDAR_EVENTS);
}

export function getLocalTimetable(): TimetableEntry[] {
  return getStoredArray(STORAGE_KEYS.TIMETABLE, SEED_TIMETABLE_ENTRIES);
}

export function getLocalUsers(): User[] {
  return getStoredArray(STORAGE_KEYS.USERS, []);
}

export function saveLocalUsers(users: User[]): void {
  saveArray(STORAGE_KEYS.USERS, users);
}

export interface StoredSession {
  token: string;
  user: User;
  linkedStudent: Student | null;
  linkedTeacher: Teacher | null;
  timestamp: number;
  rememberMe: boolean;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || sessionStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveStoredSession(session: StoredSession): void {
  try {
    const serialized = JSON.stringify(session);
    if (session.rememberMe) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, serialized);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, serialized);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}
