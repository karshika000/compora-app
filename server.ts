import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_STUDENTS, INITIAL_EVENTS, INITIAL_ACHIEVEMENTS, INITIAL_PARTICIPATION, POINT_SYSTEM } from './src/data/initialData';
import {
  INITIAL_TEACHERS,
  INITIAL_ACADEMIC_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENT_RESULTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_SUBMISSIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_PORTAL_EVENTS,
  INITIAL_NOTIFICATIONS,
} from './src/data/portalData';
import {
  SEED_TIMETABLE_ENTRIES,
  SEED_EXAMS,
  SEED_HOLIDAYS,
  SEED_CALENDAR_EVENTS,
} from './src/data/seedCalendar';
import {
  Student,
  CollegeEvent,
  Achievement,
  EventParticipation,
  UserRole,
  Teacher,
  AcademicClass,
  Subject,
  StudentResult,
  Assignment,
  AssignmentSubmission,
  Announcement,
  NotificationItem,
  CalendarEvent,
  TimetableEntry,
  ExamSchedule,
  Holiday,
} from './src/types';
import {
  UserRecord,
  ActiveSession,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  createDefaultUsers,
  generateDefaultPassword,
} from './server_auth';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent Storage File
const DATA_FILE = path.join(process.cwd(), 'titan_db.json');

interface TitanDB {
  students: Student[];
  events: CollegeEvent[];
  achievements: Achievement[];
  participations: EventParticipation[];
  users: UserRecord[];
  teachers: Teacher[];
  academic_classes: AcademicClass[];
  subjects: Subject[];
  results: StudentResult[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  calendar_events: CalendarEvent[];
  timetable_entries: TimetableEntry[];
  exams: ExamSchedule[];
  holidays: Holiday[];
}

let db: TitanDB = {
  students: [...INITIAL_STUDENTS],
  events: [...INITIAL_PORTAL_EVENTS],
  achievements: [...INITIAL_ACHIEVEMENTS],
  participations: [...INITIAL_PARTICIPATION],
  users: createDefaultUsers(),
  teachers: [...INITIAL_TEACHERS],
  academic_classes: [...INITIAL_ACADEMIC_CLASSES],
  subjects: [...INITIAL_SUBJECTS],
  results: [...INITIAL_STUDENT_RESULTS],
  assignments: [...INITIAL_ASSIGNMENTS],
  submissions: [...INITIAL_ASSIGNMENT_SUBMISSIONS],
  announcements: [...INITIAL_ANNOUNCEMENTS],
  notifications: [...INITIAL_NOTIFICATIONS],
  calendar_events: [...SEED_CALENDAR_EVENTS],
  timetable_entries: [...SEED_TIMETABLE_ENTRIES],
  exams: [...SEED_EXAMS],
  holidays: [...SEED_HOLIDAYS],
};

// Try loading persisted data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.students && parsed.events) {
      // Merge students ensuring all 50 seed students exist
      const studentMap = new Map<string, Student>();
      INITIAL_STUDENTS.forEach((s) => studentMap.set(s.student_id, s));
      if (Array.isArray(parsed.students)) {
        parsed.students.forEach((s: Student) => studentMap.set(s.student_id, s));
      }
      db.students = Array.from(studentMap.values());

      // Merge events so new events are available
      const eventMap = new Map<string, CollegeEvent>();
      INITIAL_PORTAL_EVENTS.forEach((e) => eventMap.set(e.id, e));
      if (Array.isArray(parsed.events)) {
        parsed.events.forEach((e: CollegeEvent) => eventMap.set(e.id, e));
      }
      db.events = Array.from(eventMap.values());

      db.achievements = parsed.achievements && parsed.achievements.length >= INITIAL_ACHIEVEMENTS.length ? parsed.achievements : [...INITIAL_ACHIEVEMENTS];
      db.participations = parsed.participations && parsed.participations.length >= INITIAL_PARTICIPATION.length ? parsed.participations : [...INITIAL_PARTICIPATION];
      
      // Merge users ensuring all teachers and students have credentials
      const userMap = new Map<string, UserRecord>();
      createDefaultUsers().forEach((u) => userMap.set(u.username.toLowerCase(), u));
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u: UserRecord) => {
          const defaultU = userMap.get(u.username.toLowerCase());
          if (defaultU) {
            userMap.set(u.username.toLowerCase(), {
              ...defaultU,
              ...u,
              date_of_birth: u.date_of_birth || defaultU.date_of_birth,
              staff_id: u.staff_id || defaultU.staff_id,
              password_hash: u.password_changed ? u.password_hash : defaultU.password_hash,
            });
          } else {
            userMap.set(u.username.toLowerCase(), u);
          }
        });
      }
      db.users = Array.from(userMap.values());

      // Merge teachers ensuring all seed teachers exist with complete DOB and staff_id
      const teacherMap = new Map<string, Teacher>();
      INITIAL_TEACHERS.forEach((t) => teacherMap.set(t.id, t));
      if (Array.isArray(parsed.teachers)) {
        parsed.teachers.forEach((t: Teacher) => {
          const existingSeed = teacherMap.get(t.id);
          if (existingSeed) {
            teacherMap.set(t.id, {
              ...existingSeed,
              ...t,
              staff_id: t.staff_id || existingSeed.staff_id,
              date_of_birth: t.date_of_birth || existingSeed.date_of_birth,
              birth_year: t.birth_year || existingSeed.birth_year,
            });
          } else {
            teacherMap.set(t.id, t);
          }
        });
      }
      db.teachers = Array.from(teacherMap.values());
      db.academic_classes = parsed.academic_classes && parsed.academic_classes.length >= INITIAL_ACADEMIC_CLASSES.length ? parsed.academic_classes : [...INITIAL_ACADEMIC_CLASSES];
      db.subjects = parsed.subjects && parsed.subjects.length >= INITIAL_SUBJECTS.length ? parsed.subjects : [...INITIAL_SUBJECTS];
      db.results = parsed.results && parsed.results.length >= INITIAL_STUDENT_RESULTS.length ? parsed.results : [...INITIAL_STUDENT_RESULTS];
      db.assignments = parsed.assignments && parsed.assignments.length >= INITIAL_ASSIGNMENTS.length ? parsed.assignments : [...INITIAL_ASSIGNMENTS];
      db.submissions = parsed.submissions && parsed.submissions.length >= INITIAL_ASSIGNMENT_SUBMISSIONS.length ? parsed.submissions : [...INITIAL_ASSIGNMENT_SUBMISSIONS];
      db.announcements = parsed.announcements && parsed.announcements.length >= INITIAL_ANNOUNCEMENTS.length ? parsed.announcements : [...INITIAL_ANNOUNCEMENTS];
      db.notifications = parsed.notifications && parsed.notifications.length >= INITIAL_NOTIFICATIONS.length ? parsed.notifications : [...INITIAL_NOTIFICATIONS];
      db.calendar_events = Array.isArray(parsed.calendar_events) && parsed.calendar_events.length > 0 ? parsed.calendar_events : [...SEED_CALENDAR_EVENTS];
      db.timetable_entries = Array.isArray(parsed.timetable_entries) && parsed.timetable_entries.length > 0 ? parsed.timetable_entries : [...SEED_TIMETABLE_ENTRIES];
      db.exams = Array.isArray(parsed.exams) && parsed.exams.length > 0 ? parsed.exams : [...SEED_EXAMS];
      db.holidays = Array.isArray(parsed.holidays) && parsed.holidays.length > 0 ? parsed.holidays : [...SEED_HOLIDAYS];

      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    }
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }
} catch (e) {
  console.warn('Using in-memory database:', e);
}

function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// In-Memory Active Sessions Map (Token -> ActiveSession)
const sessions = new Map<string, ActiveSession>();

// Authentication Middleware to parse Bearer Token
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserRecord | null;
      authToken?: string;
    }
  }
}

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.currentUser = null;
    return next();
  }

  const token = authHeader.substring(7).trim();
  const session = sessions.get(token);
  if (!session) {
    req.currentUser = null;
    return next();
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    req.currentUser = null;
    return next();
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user || user.status === 'Disabled') {
    sessions.delete(token);
    req.currentUser = null;
    return next();
  }

  req.currentUser = user;
  req.authToken = token;
  next();
});

// Middleware Guards
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

function requireRole(...roles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).json({ error: `Forbidden: requires ${roles.join(' or ')} permission.` });
    }
    next();
  };
}

// Lazy Gemini API client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'COMPORA',
    version: '2.4.0',
    auth_enabled: true,
    counts: {
      students: db.students.length,
      teachers: db.teachers.length,
      subjects: db.subjects.length,
      classes: db.academic_classes.length,
      events: db.events.length,
      assignments: db.assignments.length,
      submissions: db.submissions.length,
      achievements: db.achievements.length,
      participations: db.participations.length,
      announcements: db.announcements.length,
      users: db.users.length,
    },
  });
});

// Admin Manual Demo Dataset Re-seed Endpoint
app.post('/api/admin/seed-demo-data', (req, res) => {
  try {
    db.students = [...INITIAL_STUDENTS];
    db.teachers = [...INITIAL_TEACHERS];
    db.academic_classes = [...INITIAL_ACADEMIC_CLASSES];
    db.subjects = [...INITIAL_SUBJECTS];
    db.events = [...INITIAL_PORTAL_EVENTS];
    db.achievements = [...INITIAL_ACHIEVEMENTS];
    db.participations = [...INITIAL_PARTICIPATION];
    db.results = [...INITIAL_STUDENT_RESULTS];
    db.assignments = [...INITIAL_ASSIGNMENTS];
    db.submissions = [...INITIAL_ASSIGNMENT_SUBMISSIONS];
    db.announcements = [...INITIAL_ANNOUNCEMENTS];
    db.notifications = [...INITIAL_NOTIFICATIONS];
    db.users = createDefaultUsers();

    saveDB();

    res.json({
      success: true,
      message: 'Demo dataset successfully seeded and database refreshed.',
      summary: {
        students: db.students.length,
        teachers: db.teachers.length,
        subjects: db.subjects.length,
        classes: db.academic_classes.length,
        events: db.events.length,
        assignments: db.assignments.length,
        submissions: db.submissions.length,
        achievements: db.achievements.length,
        participations: db.participations.length,
        announcements: db.announcements.length,
        users: db.users.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed demo data', details: err?.message });
  }
});

// Authentication Endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const query = String(username).trim().toLowerCase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === query || u.email.toLowerCase() === query
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  if (user.status === 'Disabled') {
    return res.status(403).json({
      error: 'This account has been disabled by the administrator. Please contact your college authority.',
    });
  }

  const isPasswordValid = verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  // Update last login timestamp
  user.last_login = new Date().toISOString();
  saveDB();

  // Create active session
  const token = `titan_token_${crypto.randomBytes(32).toString('hex')}`;
  const durationMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + durationMs;

  sessions.set(token, {
    token,
    userId: user.id,
    role: user.role,
    createdAt: Date.now(),
    expiresAt,
  });

  const linkedStudent = user.student_id
    ? db.students.find((s) => s.student_id.toLowerCase() === user.student_id?.toLowerCase()) || null
    : null;

  const linkedTeacher = (user.role === 'TEACHER')
    ? db.teachers.find(
        (t) =>
          (t.staff_id && user.staff_id && t.staff_id.toLowerCase() === user.staff_id.toLowerCase()) ||
          (t.id && user.teacher_id && t.id === user.teacher_id) ||
          (t.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.username && (t.staff_id || '').toLowerCase() === user.username.toLowerCase())
      ) || null
    : null;

  res.json({
    token,
    user: sanitizeUser(user),
    linkedStudent,
    linkedTeacher,
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = req.currentUser!;
  const linkedStudent = user.student_id
    ? db.students.find((s) => s.student_id.toLowerCase() === user.student_id?.toLowerCase()) || null
    : null;

  const linkedTeacher = (user.role === 'TEACHER')
    ? db.teachers.find(
        (t) =>
          (t.staff_id && user.staff_id && t.staff_id.toLowerCase() === user.staff_id.toLowerCase()) ||
          (t.id && user.teacher_id && t.id === user.teacher_id) ||
          (t.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.username && (t.staff_id || '').toLowerCase() === user.username.toLowerCase())
      ) || null
    : null;

  res.json({
    user: sanitizeUser(user),
    linkedStudent,
    linkedTeacher,
  });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.authToken) {
    sessions.delete(req.authToken);
  }
  res.json({ message: 'Signed out successfully' });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const user = req.currentUser!;
  const isMatch = verifyPassword(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password does not match' });
  }

  user.password_hash = hashPassword(newPassword);
  user.password_changed = true;
  saveDB();
  res.json({ message: 'Password changed successfully' });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { name, email, phone } = req.body;
  const user = req.currentUser!;

  if (name && typeof name === 'string') user.name = name.trim();
  if (email && typeof email === 'string') user.email = email.trim();
  if (phone !== undefined) user.phone = String(phone).trim();

  // If user is a student, sync name/email/phone with student directory
  if (user.student_id) {
    const std = db.students.find((s) => s.student_id.toLowerCase() === user.student_id?.toLowerCase());
    if (std) {
      if (name) std.name = user.name;
      if (email) std.email = user.email;
      if (phone !== undefined) std.phone = user.phone;
    }
  }

  saveDB();
  res.json({ user: sanitizeUser(user) });
});

// Admin User Management Endpoints
app.get('/api/users', requireRole('ADMIN'), (req, res) => {
  res.json(db.users.map(sanitizeUser));
});

app.post('/api/users', requireRole('ADMIN'), (req, res) => {
  const { username, email, name, role, password, student_id, department, phone, status } = req.body;
  if (!username || !email || !name || !role || !password) {
    return res.status(400).json({ error: 'Username, email, name, role, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normUser = username.trim().toLowerCase();
  const normEmail = email.trim().toLowerCase();

  if (db.users.some((u) => u.username.toLowerCase() === normUser)) {
    return res.status(400).json({ error: `Username "${username}" already exists.` });
  }
  if (db.users.some((u) => u.email.toLowerCase() === normEmail)) {
    return res.status(400).json({ error: `Email "${email}" is already registered.` });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username: username.trim(),
    email: email.trim(),
    name: name.trim(),
    role,
    status: status || 'Active',
    student_id: role === 'STUDENT' ? (student_id ? student_id.trim().toUpperCase() : undefined) : undefined,
    department: department || undefined,
    phone: phone || undefined,
    created_at: new Date().toISOString(),
    password_hash: hashPassword(password),
  };

  db.users.unshift(newUser);
  saveDB();
  res.status(201).json(sanitizeUser(newUser));
});

app.put('/api/users/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, email, role, status, student_id, department, phone } = req.body;
  if (name) user.name = name.trim();
  if (email) user.email = email.trim();
  if (role) user.role = role;
  if (status) {
    user.status = status;
    // If disabling this user, revoke active sessions
    if (status === 'Disabled') {
      for (const [token, sess] of sessions.entries()) {
        if (sess.userId === id) sessions.delete(token);
      }
    }
  }
  if (student_id !== undefined) user.student_id = student_id ? student_id.trim().toUpperCase() : undefined;
  if (department !== undefined) user.department = department;
  if (phone !== undefined) user.phone = phone;

  saveDB();
  res.json(sanitizeUser(user));
});

app.post('/api/users/:id/reset-password', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.password_hash = hashPassword(newPassword);
  saveDB();
  res.json({ message: `Password reset successfully for ${user.username}` });
});

app.delete('/api/users/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  if (req.currentUser?.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own active administrator account' });
  }

  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const deleted = db.users.splice(index, 1)[0];
  // Revoke active sessions for this user
  for (const [token, sess] of sessions.entries()) {
    if (sess.userId === id) sessions.delete(token);
  }

  saveDB();
  res.json({ message: `User "${deleted.username}" removed`, id });
});

// Full state endpoint with backend data privacy enforcement
app.get('/api/data', (req, res) => {
  const user = req.currentUser;

  if (!user) {
    return res.json({
      students: db.students,
      events: db.events,
      achievements: db.achievements,
      participations: db.participations,
      teachers: db.teachers,
      academic_classes: db.academic_classes,
      subjects: db.subjects,
      results: [],
      assignments: db.assignments,
      submissions: [],
      announcements: db.announcements,
      notifications: [],
    });
  }

  if (user.role === 'STUDENT') {
    const studentId = user.student_id?.toLowerCase() || '';
    const student = db.students.find((s) => s.student_id.toLowerCase() === studentId);
    const studentClass = student ? `${student.year} ${student.department} ${student.section}` : '';

    return res.json({
      students: student ? [student] : [],
      events: db.events,
      achievements: db.achievements.filter((a) => a.student_id.toLowerCase() === studentId),
      participations: db.participations.filter((p) => p.student_id.toLowerCase() === studentId),
      teachers: db.teachers.map((t) => ({ ...t, phone: undefined })),
      academic_classes: db.academic_classes,
      subjects: db.subjects,
      results: db.results.filter((r) => r.student_id.toLowerCase() === studentId),
      assignments: db.assignments.filter(
        (a) => a.class_name === studentClass || (student && a.class_name.includes(student.department))
      ),
      submissions: db.submissions.filter((s) => s.student_id.toLowerCase() === studentId),
      announcements: db.announcements.filter(
        (a) =>
          a.target_audience === 'ALL' ||
          a.target_audience === 'STUDENTS' ||
          (student && a.target_audience === student.department)
      ),
      notifications: db.notifications.filter(
        (n) =>
          n.recipient_role === 'ALL' ||
          n.recipient_role === 'STUDENT' ||
          n.recipient_id === user.id
      ),
    });
  }

  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    const assignedSubjects = teacher?.assigned_subjects || [];

    // Filter students by assigned classes
    const classStudents = db.students.filter((s) => {
      const clsName = `${s.year} ${s.department} ${s.section}`;
      return assignedClasses.includes(clsName) || (assignedClasses.length === 0 && s.department === user.department);
    });

    const teacherStudentIds = new Set(classStudents.map((s) => s.student_id.toLowerCase()));

    // Strict Mark Privacy: Teacher can ONLY see marks for their assigned subjects AND assigned classes
    const scopedResults = db.results.filter((r) => {
      if (assignedClasses.length > 0 && !assignedClasses.includes(r.class_name)) return false;
      if (assignedSubjects.length > 0 && !assignedSubjects.includes(r.subject_name)) return false;
      return true;
    });

    // Scoped assignments created by this teacher or for their subjects/classes
    const scopedAssignments = db.assignments.filter(
      (a) =>
        a.teacher_id === teacher?.id ||
        assignedClasses.includes(a.class_name) ||
        assignedSubjects.includes(a.subject_name)
    );
    const assignmentIds = new Set(scopedAssignments.map((a) => a.id));

    const scopedSubmissions = db.submissions.filter(
      (s) => assignmentIds.has(s.assignment_id) || teacherStudentIds.has(s.student_id.toLowerCase())
    );

    return res.json({
      students: classStudents,
      events: db.events,
      achievements: db.achievements.filter((a) => teacherStudentIds.has(a.student_id.toLowerCase())),
      participations: db.participations,
      teachers: db.teachers,
      academic_classes: db.academic_classes,
      subjects: db.subjects,
      results: scopedResults,
      assignments: scopedAssignments,
      submissions: scopedSubmissions,
      announcements: db.announcements.filter(
        (a) =>
          a.target_audience === 'ALL' ||
          a.target_audience === 'TEACHERS' ||
          (user.department && a.target_audience === user.department)
      ),
      notifications: db.notifications.filter(
        (n) =>
          n.recipient_role === 'ALL' ||
          n.recipient_role === 'TEACHER' ||
          n.recipient_id === user.id
      ),
    });
  }

  // ADMIN: full institutional access
  res.json({
    students: db.students,
    events: db.events,
    achievements: db.achievements,
    participations: db.participations,
    teachers: db.teachers,
    academic_classes: db.academic_classes,
    subjects: db.subjects,
    results: db.results,
    assignments: db.assignments,
    submissions: db.submissions,
    announcements: db.announcements,
    notifications: db.notifications,
  });
});

// Helper for validating Date of Birth (YYYY-MM-DD or DD/MM/YYYY) for Students and Teachers
function validateDOB(
  dobStr?: string,
  role: 'STUDENT' | 'TEACHER' = 'STUDENT'
): { valid: boolean; error?: string; birthYear?: number; formatted?: string } {
  if (!dobStr || typeof dobStr !== 'string' || !dobStr.trim()) {
    return { valid: false, error: 'Date of Birth is required and cannot be empty.' };
  }
  const clean = dobStr.trim();
  let year = 0;
  let month = 0;
  let day = 0;

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const matchIso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(clean);
  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY
  const matchDmy = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(clean);

  if (matchIso) {
    year = parseInt(matchIso[1], 10);
    month = parseInt(matchIso[2], 10);
    day = parseInt(matchIso[3], 10);
  } else if (matchDmy) {
    day = parseInt(matchDmy[1], 10);
    month = parseInt(matchDmy[2], 10);
    year = parseInt(matchDmy[3], 10);
  } else {
    return { valid: false, error: 'Date of Birth must be in YYYY-MM-DD or DD/MM/YYYY format.' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month in Date of Birth (must be between 1 and 12).' };
  }

  // Check days in month (handling leap years correctly, rejecting invalid dates like 31/02/1985)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: `Invalid date: Month ${month} does not have ${day} days.` };
  }

  const dobDate = new Date(year, month - 1, day);
  const today = new Date();

  // Future date check
  if (dobDate > today) {
    return { valid: false, error: 'Future dates are not allowed for Date of Birth.' };
  }

  // Age checks
  const age = (today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (role === 'TEACHER') {
    if (age < 20) {
      return { valid: false, error: 'Faculty instructor must be of reasonable age (at least 20 years old).' };
    }
    if (age > 85) {
      return { valid: false, error: 'Please enter a valid realistic faculty birth date.' };
    }
  } else {
    if (age < 14) {
      return { valid: false, error: 'Student must be of reasonable college age (at least 14 years old).' };
    }
    if (age > 75) {
      return { valid: false, error: 'Please enter a valid realistic student birth date.' };
    }
  }

  const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { valid: true, birthYear: year, formatted };
}

// Students Directory with Backend Data Privacy Enforcement
app.get('/api/students', (req, res) => {
  const user = req.currentUser;
  if (!user) {
    return res.json(db.students);
  }

  // STUDENT: Privacy rule - only see self!
  if (user.role === 'STUDENT') {
    const studentId = user.student_id?.toLowerCase() || '';
    const self = db.students.filter((s) => s.student_id.toLowerCase() === studentId);
    return res.json(self);
  }

  // TEACHER: Privacy rule - only see assigned classes and DO NOT expose private student DOB
  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    let filtered = db.students;
    if (assignedClasses.length === 0) {
      filtered = db.students.filter((s) => s.department === user.department);
    } else {
      filtered = db.students.filter((s) => {
        const clsName = `${s.year} ${s.department} ${s.section}`;
        return assignedClasses.includes(clsName);
      });
    }

    // Strip private date_of_birth for teacher role (Requirement 10)
    const sanitized = filtered.map(({ date_of_birth, ...rest }) => rest);
    return res.json(sanitized);
  }

  // ADMIN: see all students with authorized full DOB
  res.json(db.students);
});

// Single Student Dossier (Privacy Checked)
app.get('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const student = db.students.find((s) => s.id === id || s.student_id.toLowerCase() === id.toLowerCase());
  if (!student) {
    return res.status(404).json({ error: 'Student not found in institutional directory' });
  }

  const user = req.currentUser;
  if (user && user.role === 'STUDENT') {
    if (student.student_id.toLowerCase() !== user.student_id?.toLowerCase()) {
      return res.status(403).json({
        error: 'Data Privacy Violation: You are strictly forbidden from viewing another student record.',
      });
    }
    return res.json(student);
  }

  if (user && user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    const clsName = `${student.year} ${student.department} ${student.section}`;
    if (assignedClasses.length > 0 && !assignedClasses.includes(clsName)) {
      return res.status(403).json({
        error: `Access Denied: Student is in ${clsName}, which is not in your assigned teaching roster.`,
      });
    }
    // Teacher should not see private DOB
    const { date_of_birth, ...teacherSafeStudent } = student;
    return res.json(teacherSafeStudent);
  }

  res.json(student);
});

app.post('/api/students', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { student_id, name, department, year, section, house, email, phone, date_of_birth } = req.body;
  if (!student_id || !name || !department || !year || !house) {
    return res.status(400).json({ error: 'Missing required student fields (ID, Name, Department, Year, House)' });
  }

  // Validate Date of Birth (Requirement 1 & 2)
  let birthYear = 2005;
  let formattedDob: string | undefined = undefined;

  if (date_of_birth) {
    const dobCheck = validateDOB(date_of_birth);
    if (!dobCheck.valid) {
      return res.status(400).json({ error: dobCheck.error || 'Invalid Date of Birth.' });
    }
    formattedDob = dobCheck.formatted;
    birthYear = dobCheck.birthYear || 2005;
  } else if (req.currentUser?.role === 'ADMIN') {
    // If Admin adding student, DOB is required
    return res.status(400).json({ error: 'Date of Birth is required for new student enrollment.' });
  }

  // Check unique student_id
  const exists = db.students.some((s) => s.student_id.toLowerCase() === student_id.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Student ID "${student_id}" already exists in collegiate records` });
  }

  const cleanId = student_id.trim().toUpperCase();
  const cleanName = name.trim();

  const newStudent: Student = {
    id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    student_id: cleanId,
    name: cleanName,
    department,
    year,
    section: section || 'Section A',
    house,
    date_of_birth: formattedDob,
    birth_year: birthYear,
    email: email || `${cleanId.toLowerCase()}@compora.edu`,
    phone: phone || '',
  };

  db.students.unshift(newStudent);

  // Derive initial password per college project rule (Requirement 6, 7 & 8)
  // username = Registration Number, password = name4@birthYear
  const rawPassword = generateDefaultPassword(cleanName, birthYear);
  const existingUserIndex = db.users.findIndex((u) => u.username.toLowerCase() === cleanId.toLowerCase());

  if (existingUserIndex === -1) {
    db.users.push({
      id: `usr-${cleanId.toLowerCase()}`,
      username: cleanId,
      email: newStudent.email || `${cleanId.toLowerCase()}@compora.edu`,
      name: cleanName,
      role: 'STUDENT',
      status: 'Active',
      student_id: cleanId,
      department,
      date_of_birth: formattedDob,
      phone: phone || '',
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword(rawPassword),
    });
  }

  saveDB();
  res.status(201).json(newStudent);
});

app.put('/api/students/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.students.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const old = db.students[index];
  let birthYear = old.birth_year || (old.date_of_birth ? parseInt(old.date_of_birth.split('-')[0], 10) : 2005);
  let formattedDob = old.date_of_birth;

  // Validate DOB if updated
  if (req.body.date_of_birth !== undefined) {
    if (req.body.date_of_birth) {
      const dobCheck = validateDOB(req.body.date_of_birth);
      if (!dobCheck.valid) {
        return res.status(400).json({ error: dobCheck.error || 'Invalid Date of Birth.' });
      }
      formattedDob = dobCheck.formatted;
      birthYear = dobCheck.birthYear || birthYear;
    } else {
      formattedDob = undefined;
    }
  }

  const updated: Student = {
    ...old,
    ...req.body,
    id: old.id,
    student_id: (req.body.student_id || old.student_id).trim().toUpperCase(),
    date_of_birth: formattedDob,
    birth_year: birthYear,
  };

  db.students[index] = updated;

  // Requirement 15: If student has never changed their default password, update password hash based on new birth year.
  // If student has already changed their password, DO NOT overwrite their custom password.
  const userRecord = db.users.find(
    (u) =>
      (u.student_id && u.student_id.toLowerCase() === old.student_id.toLowerCase()) ||
      u.username.toLowerCase() === old.student_id.toLowerCase()
  );

  if (userRecord) {
    userRecord.name = updated.name;
    userRecord.date_of_birth = formattedDob;
    if (updated.email) userRecord.email = updated.email;

    if (!userRecord.password_changed && req.body.date_of_birth) {
      const newRawPassword = generateDefaultPassword(updated.name, birthYear);
      userRecord.password_hash = hashPassword(newRawPassword);
    }
  }

  saveDB();
  res.json(updated);
});

// Dataset CSV Import with DOB and mandatory fields validation (student_id, department, name, date_of_birth)
app.post('/api/students/import-csv', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { students: importList } = req.body;
  if (!Array.isArray(importList) || importList.length === 0) {
    return res.status(400).json({ error: 'No student records provided for bulk import.' });
  }

  const results: {
    successCount: number;
    failedCount: number;
    errors: { row: number; student_id?: string; error: string }[];
  } = {
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  const validDepts = ['CSE', 'IT', 'AI&DS', 'CSBS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'BME'];
  const seenBatchIds = new Set<string>();

  importList.forEach((row: any, idx: number) => {
    const rowNum = idx + 1;
    const rawId = row.student_id || row.registration_number || row.roll_no || row.reg_no;
    const name = row.name || row.student_name || row.full_name;
    const dept = row.department || row.dept || row.branch;
    const year = row.year || row.academic_year || '1st Year';
    const section = row.section || row.class_section || 'Section A';
    const house = row.house || 'Red';
    const rawDob = row.date_of_birth || row.dob || row.birth_date;

    // Validate Mandatory Field 1: student_id
    if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        error: 'Mandatory field missing: "student_id" (Registration Number) is required.',
      });
      return;
    }

    const cleanRegNo = String(rawId).trim().toUpperCase();

    // Validate Mandatory Field 2: name
    if (!name || typeof name !== 'string' || !name.trim()) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        student_id: cleanRegNo,
        error: 'Mandatory field missing: "name" (Student Full Name) is required.',
      });
      return;
    }

    // Validate Mandatory Field 3: department
    if (!dept || typeof dept !== 'string' || !dept.trim()) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        student_id: cleanRegNo,
        error: 'Mandatory field missing: "department" is required.',
      });
      return;
    }

    // Normalize department if possible
    const cleanDept = String(dept).trim();
    const matchedDept = validDepts.find((d) => d.toLowerCase() === cleanDept.toLowerCase()) || cleanDept;

    // Check duplicate in the current database
    if (db.students.some((s) => s.student_id.toLowerCase() === cleanRegNo.toLowerCase())) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        student_id: cleanRegNo,
        error: `Duplicate: Student ID "${cleanRegNo}" already exists in collegiate records.`,
      });
      return;
    }

    // Check duplicate within the uploaded CSV batch
    if (seenBatchIds.has(cleanRegNo.toLowerCase())) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        student_id: cleanRegNo,
        error: `Duplicate: Student ID "${cleanRegNo}" appears multiple times in this CSV file.`,
      });
      return;
    }

    // Validate Date of Birth if present, or validate strictly
    let birthYear = 2005;
    let formattedDob: string | undefined = undefined;

    if (rawDob) {
      const dobCheck = validateDOB(rawDob);
      if (!dobCheck.valid) {
        results.failedCount++;
        results.errors.push({
          row: rowNum,
          student_id: cleanRegNo,
          error: `Date of Birth is invalid: ${dobCheck.error}`,
        });
        return;
      }
      formattedDob = dobCheck.formatted;
      birthYear = dobCheck.birthYear || 2005;
    } else {
      // Default to standard year
      formattedDob = undefined;
      birthYear = 2005;
    }

    seenBatchIds.add(cleanRegNo.toLowerCase());

    const cleanName = String(name).trim();
    const newStudent: Student = {
      id: `std-imp-${Date.now()}-${idx}`,
      student_id: cleanRegNo,
      name: cleanName,
      department: matchedDept as any,
      year: (String(year).includes('Year') ? String(year) : `${year} Year`) as any,
      section: String(section).includes('Section') ? String(section) : `Section ${section}`,
      house: (house === 'Blue' || house === 'Red' || house === 'Green' || house === 'Yellow') ? house : 'Red',
      date_of_birth: formattedDob,
      birth_year: birthYear,
      email: row.email || `${cleanRegNo.toLowerCase()}@compora.edu`,
      phone: row.phone || '',
    };

    db.students.push(newStudent);

    // Create user login with derived default password
    const rawPass = generateDefaultPassword(cleanName, birthYear);
    db.users.push({
      id: `usr-${cleanRegNo.toLowerCase()}`,
      username: cleanRegNo,
      email: newStudent.email!,
      name: cleanName,
      role: 'STUDENT',
      status: 'Active',
      student_id: cleanRegNo,
      department: matchedDept as any,
      date_of_birth: formattedDob,
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword(rawPass),
    });

    results.successCount++;
  });

  saveDB();
  res.json({
    message: `Import complete: ${results.successCount} enrolled, ${results.failedCount} failed validation.`,
    ...results,
  });
});

app.delete('/api/students/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const student = db.students.find((s) => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  db.students = db.students.filter((s) => s.id !== id);
  db.participations = db.participations.filter((p) => p.student_id !== student.student_id);
  db.achievements = db.achievements.filter((a) => a.student_id !== student.student_id);
  db.results = db.results.filter((r) => r.student_id !== student.student_id);
  db.submissions = db.submissions.filter((s) => s.student_id !== student.student_id);
  saveDB();
  res.json({ message: 'Student and related records deleted', id });
});

// Teachers Management CRUD (Requirements 1, 2, 3, 5, 6, 7, 8, 11, 13, 14, 15, 16)
app.get('/api/teachers/me', requireRole('TEACHER'), (req, res) => {
  const user = req.currentUser!;
  const teacher = db.teachers.find(
    (t) =>
      (t.staff_id && user.staff_id && t.staff_id.toLowerCase() === user.staff_id.toLowerCase()) ||
      (t.id && user.teacher_id && t.id === user.teacher_id) ||
      (t.email && user.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
      (user.username && (t.staff_id || '').toLowerCase() === user.username.toLowerCase())
  );
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found' });
  }
  // Teacher can view their own full DOB (Requirement 11 & 12)
  res.json(teacher);
});

app.get('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const teacher = db.teachers.find((t) => t.id === id || (t.staff_id && t.staff_id.toLowerCase() === id.toLowerCase()));
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  const user = req.currentUser;
  if (!user || user.role === 'ADMIN') {
    return res.json(teacher);
  }

  const isSelf =
    (teacher.staff_id && user.staff_id && teacher.staff_id.toLowerCase() === user.staff_id.toLowerCase()) ||
    (teacher.email && user.email && teacher.email.toLowerCase() === user.email.toLowerCase()) ||
    (teacher.name && user.name && teacher.name.toLowerCase() === user.name.toLowerCase()) ||
    (teacher.id && user.teacher_id && teacher.id === user.teacher_id);

  if (isSelf) {
    return res.json(teacher);
  }

  // Hide private DOB from other teachers, students, etc. (Requirement 11)
  const { date_of_birth, ...safeTeacher } = teacher;
  res.json(safeTeacher);
});

app.get('/api/teachers', (req, res) => {
  const user = req.currentUser;
  if (!user || user.role === 'ADMIN') {
    return res.json(db.teachers);
  }

  // TEACHER: Can see their own DOB, but other teachers' DOBs are masked (Requirement 11)
  if (user.role === 'TEACHER') {
    const sanitized = db.teachers.map((t) => {
      const isSelf =
        (t.staff_id && user.staff_id && t.staff_id.toLowerCase() === user.staff_id.toLowerCase()) ||
        (t.email && user.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
        (t.name && user.name && t.name.toLowerCase() === user.name.toLowerCase()) ||
        (t.id && user.teacher_id && t.id === user.teacher_id);
      if (isSelf) return t;
      const { date_of_birth, ...rest } = t;
      return rest;
    });
    return res.json(sanitized);
  }

  // STUDENT / OTHER: Do NOT expose teacher private DOB (Requirement 11)
  const sanitized = db.teachers.map(({ date_of_birth, ...rest }) => rest);
  res.json(sanitized);
});

app.post('/api/teachers', requireRole('ADMIN'), (req, res) => {
  const {
    staff_id,
    name,
    email,
    department,
    designation,
    phone,
    date_of_birth,
    assigned_classes,
    assigned_subjects,
    can_publish_events,
  } = req.body;

  if (!name || !email || !department) {
    return res.status(400).json({ error: 'Name, email, and department are required.' });
  }

  // Validate Date of Birth (Requirement 1 & 2)
  let birthYear = 1985;
  let formattedDob: string | undefined = undefined;

  if (date_of_birth) {
    const dobCheck = validateDOB(date_of_birth, 'TEACHER');
    if (!dobCheck.valid) {
      return res.status(400).json({ error: dobCheck.error || 'Invalid Date of Birth.' });
    }
    formattedDob = dobCheck.formatted;
    birthYear = dobCheck.birthYear || 1985;
  } else {
    return res.status(400).json({ error: 'Date of Birth is required for new teacher enrollment.' });
  }

  // Staff ID handling (Requirement 5: USERNAME = UNIQUE STAFF ID, e.g. STF001)
  let cleanStaffId = staff_id ? String(staff_id).trim().toUpperCase() : '';
  if (!cleanStaffId) {
    const count = db.teachers.length + 1;
    cleanStaffId = `STF${String(count).padStart(3, '0')}`;
    let counter = count;
    while (
      db.teachers.some((t) => (t.staff_id || '').toLowerCase() === cleanStaffId.toLowerCase()) ||
      db.users.some((u) => u.username.toLowerCase() === cleanStaffId.toLowerCase())
    ) {
      counter++;
      cleanStaffId = `STF${String(counter).padStart(3, '0')}`;
    }
  } else {
    const exists =
      db.teachers.some((t) => (t.staff_id || '').toLowerCase() === cleanStaffId.toLowerCase()) ||
      db.users.some((u) => u.username.toLowerCase() === cleanStaffId.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: `Staff ID / Username "${cleanStaffId}" is already taken.` });
    }
  }

  const cleanName = name.trim();
  const newTeacherId = `teach-${Date.now()}`;

  const newTeacher: Teacher = {
    id: newTeacherId,
    staff_id: cleanStaffId,
    user_id: `usr-${cleanStaffId.toLowerCase()}`,
    name: cleanName,
    email: email.trim(),
    department,
    phone: phone || '',
    designation: designation || 'Assistant Professor',
    date_of_birth: formattedDob,
    birth_year: birthYear,
    assigned_classes: Array.isArray(assigned_classes) ? assigned_classes : [],
    assigned_subjects: Array.isArray(assigned_subjects) ? assigned_subjects : [],
    can_publish_events: can_publish_events ?? true,
    status: 'Active',
  };

  db.teachers.unshift(newTeacher);

  // Generate initial login password (Requirement 6 & 7: first 4 letters in lowercase + @ + birthYear, e.g. arun@1985)
  const rawPassword = generateDefaultPassword(cleanName, birthYear);
  db.users.push({
    id: `usr-${cleanStaffId.toLowerCase()}`,
    username: cleanStaffId,
    email: newTeacher.email,
    name: cleanName,
    role: 'TEACHER',
    status: 'Active',
    staff_id: cleanStaffId,
    teacher_id: newTeacherId,
    department,
    date_of_birth: formattedDob,
    phone: phone || '',
    password_changed: false,
    created_at: new Date().toISOString(),
    password_hash: hashPassword(rawPassword),
  });

  saveDB();
  res.status(201).json(newTeacher);
});

app.put('/api/teachers/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.teachers.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  const old = db.teachers[index];
  let birthYear = old.birth_year || (old.date_of_birth ? parseInt(old.date_of_birth.split('-')[0], 10) : 1985);
  let formattedDob = old.date_of_birth;

  if (req.body.date_of_birth !== undefined) {
    if (req.body.date_of_birth) {
      const dobCheck = validateDOB(req.body.date_of_birth, 'TEACHER');
      if (!dobCheck.valid) {
        return res.status(400).json({ error: dobCheck.error || 'Invalid Date of Birth.' });
      }
      formattedDob = dobCheck.formatted;
      birthYear = dobCheck.birthYear || birthYear;
    } else {
      formattedDob = undefined;
    }
  }

  const updatedStaffId = req.body.staff_id ? req.body.staff_id.trim().toUpperCase() : (old.staff_id || old.id.replace('teach-', 'STF00'));

  const updated: Teacher = {
    ...old,
    ...req.body,
    id: old.id,
    staff_id: updatedStaffId,
    date_of_birth: formattedDob,
    birth_year: birthYear,
  };

  db.teachers[index] = updated;

  // Requirement 16: If Admin changes teacher DOB:
  // If teacher has NEVER changed their password (!userRecord.password_changed), update password hash based on new birth year.
  // If teacher HAS changed password, DO NOT overwrite their custom password.
  const userRecord = db.users.find(
    (u) =>
      (u.staff_id && old.staff_id && u.staff_id.toLowerCase() === old.staff_id.toLowerCase()) ||
      (u.teacher_id && u.teacher_id === old.id) ||
      (u.email && u.email.toLowerCase() === old.email.toLowerCase()) ||
      (old.staff_id && u.username.toLowerCase() === old.staff_id.toLowerCase())
  );

  if (userRecord) {
    userRecord.name = updated.name;
    userRecord.date_of_birth = formattedDob;
    if (updatedStaffId) userRecord.staff_id = updatedStaffId;
    if (updated.email) userRecord.email = updated.email;

    if (!userRecord.password_changed && req.body.date_of_birth) {
      const newRawPassword = generateDefaultPassword(updated.name, birthYear);
      userRecord.password_hash = hashPassword(newRawPassword);
    }
  }

  saveDB();
  res.json(updated);
});

app.delete('/api/teachers/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const teacher = db.teachers.find((t) => t.id === id);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  db.teachers = db.teachers.filter((t) => t.id !== id);
  if (teacher.staff_id) {
    db.users = db.users.filter((u) => u.username.toLowerCase() !== teacher.staff_id!.toLowerCase() && u.id !== teacher.user_id);
  }
  saveDB();
  res.json({ message: 'Teacher removed', id });
});

// Teacher Dataset CSV Import (Requirement 14)
app.post('/api/teachers/import-csv', requireRole('ADMIN'), (req, res) => {
  const { teachers: importList } = req.body;
  if (!Array.isArray(importList) || importList.length === 0) {
    return res.status(400).json({ error: 'No teacher records provided for import.' });
  }

  const results: {
    successCount: number;
    failedCount: number;
    errors: { row: number; staff_id?: string; error: string }[];
  } = {
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  importList.forEach((row: any, idx: number) => {
    const rowNum = idx + 1;
    const staffId = row.staff_id || row.staffId || row.id;
    const name = row.name;
    const dept = row.department;
    const rawDob = row.date_of_birth || row.dob;
    const designation = row.designation || 'Assistant Professor';
    const email = row.email || (staffId ? `${String(staffId).toLowerCase()}@compora.edu` : `${String(name).toLowerCase().replace(/\s+/g, '.')}@compora.edu`);
    const phone = row.phone || '';

    if (!staffId || !name || !dept) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        staff_id: staffId,
        error: 'Missing required fields (staff_id, name, or department).',
      });
      return;
    }

    // Validate DOB strictly (Requirement 14: "Do not create a teacher if DOB is invalid.")
    const dobCheck = validateDOB(rawDob, 'TEACHER');
    if (!dobCheck.valid) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        staff_id: staffId,
        error: `Date of Birth is missing or invalid: ${dobCheck.error}`,
      });
      return;
    }

    const cleanStaffId = String(staffId).trim().toUpperCase();

    // Check duplicates
    if (
      db.teachers.some((t) => (t.staff_id || '').toLowerCase() === cleanStaffId.toLowerCase()) ||
      db.users.some((u) => u.username.toLowerCase() === cleanStaffId.toLowerCase())
    ) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        staff_id: cleanStaffId,
        error: `Staff ID "${cleanStaffId}" already exists.`,
      });
      return;
    }

    const birthYear = dobCheck.birthYear || 1985;
    const newTeacherId = `teach-imp-${Date.now()}-${idx}`;
    const cleanName = String(name).trim();

    const newTeacher: Teacher = {
      id: newTeacherId,
      staff_id: cleanStaffId,
      user_id: `usr-${cleanStaffId.toLowerCase()}`,
      name: cleanName,
      email: email.trim(),
      department: dept,
      phone: phone,
      designation: designation,
      date_of_birth: dobCheck.formatted,
      birth_year: birthYear,
      assigned_classes: [],
      assigned_subjects: [],
      can_publish_events: true,
      status: 'Active',
    };

    db.teachers.push(newTeacher);

    // Create user login with derived default password (Requirement 6 & 7)
    const rawPass = generateDefaultPassword(cleanName, birthYear);
    db.users.push({
      id: `usr-${cleanStaffId.toLowerCase()}`,
      username: cleanStaffId,
      email: newTeacher.email,
      name: cleanName,
      role: 'TEACHER',
      status: 'Active',
      staff_id: cleanStaffId,
      teacher_id: newTeacherId,
      department: dept,
      date_of_birth: dobCheck.formatted,
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword(rawPass),
    });

    results.successCount++;
  });

  saveDB();
  res.json({
    message: `Import complete: ${results.successCount} faculty enrolled, ${results.failedCount} failed validation.`,
    ...results,
  });
});

// Academic Structure Endpoints
app.get('/api/academic-structure', (req, res) => {
  res.json({
    classes: db.academic_classes,
    subjects: db.subjects,
    departments: ['CSE', 'IT', 'AI&DS', 'CSBS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'BME'],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    sections: ['Section A', 'Section B'],
  });
});

app.post('/api/classes', requireRole('ADMIN'), (req, res) => {
  const { name, department, year, section, class_advisor } = req.body;
  if (!name || !department || !year || !section) {
    return res.status(400).json({ error: 'Name, department, year, and section are required' });
  }

  const newClass: AcademicClass = {
    id: `cls-${Date.now()}`,
    name: name.trim(),
    department,
    year,
    section,
    student_count: db.students.filter(
      (s) => s.department === department && s.year === year && s.section === section
    ).length,
    class_advisor,
  };

  db.academic_classes.push(newClass);
  saveDB();
  res.status(201).json(newClass);
});

app.post('/api/subjects', requireRole('ADMIN'), (req, res) => {
  const { code, name, department, semester, year, credits } = req.body;
  if (!code || !name || !department) {
    return res.status(400).json({ error: 'Subject code, name, and department are required' });
  }

  const newSubject: Subject = {
    id: `sub-${Date.now()}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    department,
    semester: semester || 'Semester 1',
    year: year || '1st Year',
    credits: Number(credits) || 3,
  };

  db.subjects.push(newSubject);
  saveDB();
  res.status(201).json(newSubject);
});

// Academic Results & Marks (STRICT MARK PRIVACY ENFORCEMENT)
app.get('/api/results', (req, res) => {
  const user = req.currentUser;

  // STUDENT: Can ONLY see their own marks
  if (user && user.role === 'STUDENT') {
    const sId = user.student_id?.toLowerCase() || '';
    const myResults = db.results.filter((r) => r.student_id.toLowerCase() === sId);
    const totalMarks = myResults.reduce((acc, r) => acc + r.mark, 0);
    const maxTotal = myResults.reduce((acc, r) => acc + r.max_marks, 0);
    const percentage = maxTotal > 0 ? (totalMarks / maxTotal) * 100 : 0;
    const cgpa = maxTotal > 0 ? Math.min(10, +(percentage / 9.5).toFixed(2)) : 0;

    return res.json({
      student_id: user.student_id,
      student_name: user.name,
      results: myResults,
      summary: {
        total_marks: totalMarks,
        max_total: maxTotal,
        percentage: +percentage.toFixed(2),
        cgpa,
        semester: myResults[0]?.semester || 'Semester 7',
        academic_year: myResults[0]?.academic_year || '2025-2026',
      },
    });
  }

  // TEACHER: Can ONLY see marks for assigned subjects and assigned classes
  if (user && user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    const assignedSubjects = teacher?.assigned_subjects || [];

    const scoped = db.results.filter((r) => {
      const matchClass = assignedClasses.length === 0 || assignedClasses.includes(r.class_name);
      const matchSubject = assignedSubjects.length === 0 || assignedSubjects.includes(r.subject_name);
      return matchClass && matchSubject;
    });

    return res.json({
      teacher_name: user.name,
      assigned_subjects: assignedSubjects,
      assigned_classes: assignedClasses,
      results: scoped,
    });
  }

  // ADMIN: full institutional view with optional query filters
  const { student_id, class_name, subject_name } = req.query;
  let results = db.results;
  if (student_id) {
    results = results.filter((r) => r.student_id.toLowerCase() === String(student_id).toLowerCase());
  }
  if (class_name) {
    results = results.filter((r) => r.class_name === class_name);
  }
  if (subject_name) {
    results = results.filter((r) => r.subject_name === subject_name);
  }

  res.json({ results });
});

// Teacher / Admin record or update marks with automatic calculation & persistence
app.post('/api/results', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const {
    student_id,
    class_name,
    subject_name,
    semester,
    academic_year,
    ia1_mark,
    ia2_mark,
    assignment_mark,
    attendance_mark,
    external_mark,
    is_published,
    credits,
  } = req.body;
  const user = req.currentUser!;

  if (!student_id || !subject_name) {
    return res.status(400).json({ error: 'Student ID and Subject Name are required' });
  }

  // Mark privacy rule check for TEACHER
  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    if (!teacher?.assigned_subjects.includes(subject_name)) {
      return res.status(403).json({
        error: `Permission Denied: You are not assigned to teach or grade "${subject_name}". Teacher mark privacy strictly enforced.`,
      });
    }
    if (class_name && teacher?.assigned_classes.length > 0 && !teacher.assigned_classes.includes(class_name)) {
      return res.status(403).json({
        error: `Permission Denied: "${class_name}" is not in your assigned class roster.`,
      });
    }
  }

  const student = db.students.find((s) => s.student_id.toLowerCase() === student_id.toLowerCase());
  if (!student) {
    return res.status(400).json({ error: `Student ID "${student_id}" does not exist` });
  }

  const subject = db.subjects.find((s) => s.name === subject_name);
  const sem = semester || 'Semester 1';
  const acadYear = academic_year || '2025-2026';
  const subjectCode = subject?.code || req.body.subject_code || 'CS100';

  // Calculate internal marks
  const ia1 = Math.min(20, Math.max(0, Number(ia1_mark !== undefined ? ia1_mark : req.body.mark !== undefined ? Math.round(Number(req.body.mark) * 0.2) : 18)));
  const ia2 = Math.min(20, Math.max(0, Number(ia2_mark !== undefined ? ia2_mark : 18)));
  const asg = Math.min(5, Math.max(0, Number(assignment_mark !== undefined ? assignment_mark : 5)));
  const att = Math.min(5, Math.max(0, Number(attendance_mark !== undefined ? attendance_mark : 5)));
  const internalTotal = ia1 + ia2 + asg + att; // Max 50

  const hasExternal = external_mark !== undefined && external_mark !== null && external_mark !== '';
  const extMark = hasExternal ? Math.min(50, Math.max(0, Number(external_mark))) : undefined;
  const published = is_published !== undefined ? Boolean(is_published) : hasExternal;

  const totalMark = published && extMark !== undefined ? internalTotal + extMark : internalTotal;
  const maxMarks = 100;
  const effectivePct = published && extMark !== undefined ? totalMark : (internalTotal / 50) * 100;

  let grade = 'Pending';
  let resultStatus: 'PASS' | 'FAIL' | 'ABSENT' | 'NOT_PUBLISHED' = 'NOT_PUBLISHED';

  if (published && extMark !== undefined) {
    if (totalMark >= 90) grade = 'O';
    else if (totalMark >= 80) grade = 'A+';
    else if (totalMark >= 70) grade = 'A';
    else if (totalMark >= 60) grade = 'B+';
    else if (totalMark >= 50) grade = 'B';
    else if (totalMark >= 45) grade = 'C';
    else grade = 'RA';

    resultStatus = totalMark >= 45 && extMark >= 20 ? 'PASS' : 'FAIL';
  }

  // Check unique record: student_id + semester + subject_code
  const existingIndex = db.results.findIndex(
    (r) =>
      r.student_id.toLowerCase() === student.student_id.toLowerCase() &&
      r.semester.toLowerCase() === sem.toLowerCase() &&
      (r.subject_code.toLowerCase() === subjectCode.toLowerCase() || r.subject_name.toLowerCase() === subject_name.toLowerCase())
  );

  const resultRecord: StudentResult = {
    id: existingIndex !== -1 ? db.results[existingIndex].id : `res-${Date.now()}`,
    student_id: student.student_id,
    student_name: student.name,
    class_name: class_name || `${student.year} ${student.department} ${student.section}`,
    subject_id: subject?.id || `sub-custom`,
    subject_name,
    subject_code: subjectCode,
    teacher_id: user.id,
    teacher_name: user.name,
    ia1_mark: ia1,
    ia2_mark: ia2,
    assignment_mark: asg,
    attendance_mark: att,
    internal_total: internalTotal,
    external_mark: extMark,
    total_mark: totalMark,
    mark: totalMark,
    max_marks: maxMarks,
    credits: Number(credits) || subject?.credits || 4,
    grade,
    result_status: resultStatus,
    is_published: published,
    semester: sem,
    academic_year: acadYear,
    updated_at: new Date().toISOString().split('T')[0],
  };

  if (existingIndex !== -1) {
    db.results[existingIndex] = resultRecord;
  } else {
    db.results.push(resultRecord);
  }

  saveDB();
  res.status(201).json(resultRecord);
});

app.put('/api/results/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.results.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Result not found' });
  }

  const current = db.results[index];
  const user = req.currentUser!;

  // Strict mark privacy check
  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    if (!teacher?.assigned_subjects.includes(current.subject_name)) {
      return res.status(403).json({
        error: `Permission Denied: You cannot modify marks for "${current.subject_name}" because it is not your assigned subject.`,
      });
    }
  }

  const ia1 = req.body.ia1_mark !== undefined ? Math.min(20, Math.max(0, Number(req.body.ia1_mark))) : (current.ia1_mark || 18);
  const ia2 = req.body.ia2_mark !== undefined ? Math.min(20, Math.max(0, Number(req.body.ia2_mark))) : (current.ia2_mark || 18);
  const asg = req.body.assignment_mark !== undefined ? Math.min(5, Math.max(0, Number(req.body.assignment_mark))) : (current.assignment_mark || 5);
  const att = req.body.attendance_mark !== undefined ? Math.min(5, Math.max(0, Number(req.body.attendance_mark))) : (current.attendance_mark || 5);
  const internalTotal = ia1 + ia2 + asg + att;

  const hasExternal = req.body.external_mark !== undefined ? req.body.external_mark !== null && req.body.external_mark !== '' : current.external_mark !== undefined;
  const extMark = req.body.external_mark !== undefined ? (req.body.external_mark !== null && req.body.external_mark !== '' ? Math.min(50, Math.max(0, Number(req.body.external_mark))) : undefined) : current.external_mark;
  const published = req.body.is_published !== undefined ? Boolean(req.body.is_published) : current.is_published;

  const totalMark = published && extMark !== undefined ? internalTotal + extMark : internalTotal;
  let grade = 'Pending';
  let resultStatus: 'PASS' | 'FAIL' | 'ABSENT' | 'NOT_PUBLISHED' = 'NOT_PUBLISHED';

  if (published && extMark !== undefined) {
    if (totalMark >= 90) grade = 'O';
    else if (totalMark >= 80) grade = 'A+';
    else if (totalMark >= 70) grade = 'A';
    else if (totalMark >= 60) grade = 'B+';
    else if (totalMark >= 50) grade = 'B';
    else if (totalMark >= 45) grade = 'C';
    else grade = 'RA';

    resultStatus = totalMark >= 45 && extMark >= 20 ? 'PASS' : 'FAIL';
  }

  db.results[index] = {
    ...current,
    ...req.body,
    ia1_mark: ia1,
    ia2_mark: ia2,
    assignment_mark: asg,
    attendance_mark: att,
    internal_total: internalTotal,
    external_mark: extMark,
    total_mark: totalMark,
    mark: totalMark,
    grade,
    result_status: resultStatus,
    is_published: published,
    updated_at: new Date().toISOString().split('T')[0],
    id,
  };

  saveDB();
  res.json(db.results[index]);
});

app.delete('/api/results/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.results.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Result record not found' });
  }

  const user = req.currentUser!;
  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    if (!teacher?.assigned_subjects.includes(db.results[index].subject_name)) {
      return res.status(403).json({
        error: `Permission Denied: You cannot delete marks for unassigned subject "${db.results[index].subject_name}".`,
      });
    }
  }

  const deleted = db.results[index];
  db.results.splice(index, 1);
  saveDB();
  res.json({ message: 'Result record deleted', id, deleted });
});

// Assignments API
app.get('/api/assignments', (req, res) => {
  const user = req.currentUser;
  if (!user) return res.json(db.assignments);

  if (user.role === 'STUDENT') {
    const sId = user.student_id?.toLowerCase() || '';
    const student = db.students.find((s) => s.student_id.toLowerCase() === sId);
    const clsName = student ? `${student.year} ${student.department} ${student.section}` : '';
    const forMe = db.assignments.filter(
      (a) => a.class_name === clsName || (student && a.class_name.includes(student.department))
    );
    return res.json(forMe);
  }

  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    const forTeacher = db.assignments.filter(
      (a) =>
        a.teacher_id === teacher?.id ||
        assignedClasses.includes(a.class_name) ||
        (teacher && teacher.assigned_subjects.includes(a.subject_name))
    );
    return res.json(forTeacher);
  }

  res.json(db.assignments);
});

app.post('/api/assignments', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { title, subject_name, class_name, description, instructions, due_date, max_marks, attachment_name } =
    req.body;
  if (!title || !subject_name || !class_name || !due_date) {
    return res.status(400).json({ error: 'Title, subject, class, and due date are required' });
  }

  const user = req.currentUser!;
  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    if (teacher && !teacher.assigned_classes.includes(class_name)) {
      return res.status(403).json({
        error: `Permission Denied: "${class_name}" is not in your assigned classes.`,
      });
    }
  }

  const subject = db.subjects.find((s) => s.name === subject_name);

  const newAssignment: Assignment = {
    id: `asg-${Date.now()}`,
    title: title.trim(),
    subject_name,
    subject_id: subject?.id || 'sub-1',
    class_name,
    teacher_id: user.id,
    teacher_name: user.name,
    description: description ? description.trim() : '',
    instructions: instructions ? instructions.trim() : '',
    created_at: new Date().toISOString(),
    due_date,
    max_marks: Number(max_marks) || 100,
    attachment_name: attachment_name || undefined,
    status: 'Active',
    submission_count: 0,
  };

  db.assignments.unshift(newAssignment);

  // Auto-broadcast notification to students in this class
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'assignment_created',
    title: `New Assignment: ${title}`,
    message: `${user.name} posted an assignment for ${class_name} due ${due_date}.`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'student_assignments',
    recipient_role: 'STUDENT',
  });

  saveDB();
  res.status(201).json(newAssignment);
});

app.delete('/api/assignments/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  db.assignments = db.assignments.filter((a) => a.id !== id);
  db.submissions = db.submissions.filter((s) => s.assignment_id !== id);
  saveDB();
  res.json({ message: 'Assignment deleted', id });
});

// Submissions API
app.get('/api/submissions', (req, res) => {
  const user = req.currentUser;
  if (!user) return res.json(db.submissions);

  if (user.role === 'STUDENT') {
    const sId = user.student_id?.toLowerCase() || '';
    return res.json(db.submissions.filter((s) => s.student_id.toLowerCase() === sId));
  }

  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    const myAssignments = db.assignments
      .filter((a) => a.teacher_id === teacher?.id || assignedClasses.includes(a.class_name))
      .map((a) => a.id);
    return res.json(db.submissions.filter((s) => myAssignments.includes(s.assignment_id)));
  }

  res.json(db.submissions);
});

app.post('/api/submissions', requireAuth, (req, res) => {
  const { assignment_id, submission_text, file_name } = req.body;
  const user = req.currentUser!;

  if (!assignment_id) {
    return res.status(400).json({ error: 'assignment_id is required' });
  }

  const assignment = db.assignments.find((a) => a.id === assignment_id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const studentId = user.student_id || '21CS001';
  const student = db.students.find((s) => s.student_id.toLowerCase() === studentId.toLowerCase());

  // Check if student already submitted - update or create
  const existingIndex = db.submissions.findIndex(
    (s) => s.assignment_id === assignment_id && s.student_id.toLowerCase() === studentId.toLowerCase()
  );

  const submission: AssignmentSubmission = {
    id: existingIndex !== -1 ? db.submissions[existingIndex].id : `subm-${Date.now()}`,
    assignment_id,
    assignment_title: assignment.title,
    subject_name: assignment.subject_name,
    student_id: studentId,
    student_name: student?.name || user.name,
    class_name: assignment.class_name,
    submitted_at: new Date().toISOString(),
    submission_text: submission_text ? submission_text.trim() : 'Submitted solution file.',
    file_name: file_name || 'submission_solution.pdf',
    status: 'Submitted',
  };

  if (existingIndex !== -1) {
    db.submissions[existingIndex] = submission;
  } else {
    db.submissions.unshift(submission);
    assignment.submission_count = (assignment.submission_count || 0) + 1;
  }

  // Notify teacher
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'assignment_submitted',
    title: `Submission Received`,
    message: `${submission.student_name} submitted "${assignment.title}".`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'teacher_submissions',
    recipient_role: 'TEACHER',
  });

  saveDB();
  res.status(201).json(submission);
});

app.put('/api/submissions/:id/grade', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const { marks, feedback } = req.body;

  const index = db.submissions.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const sub = db.submissions[index];
  const user = req.currentUser!;

  sub.marks = Number(marks);
  sub.feedback = feedback ? String(feedback).trim() : 'Good effort.';
  sub.status = 'Graded';
  sub.graded_at = new Date().toISOString();
  sub.graded_by = user.name;

  // Notify student
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'assignment_graded',
    title: `Assignment Graded: ${sub.assignment_title}`,
    message: `You received ${sub.marks} marks from ${user.name}. Feedback: "${sub.feedback}"`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'student_assignments',
    recipient_role: 'STUDENT',
  });

  saveDB();
  res.json(sub);
});

// Announcements API
app.get('/api/announcements', (req, res) => {
  res.json(db.announcements);
});

app.post('/api/announcements', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { title, content, category, target_audience, pinned } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const user = req.currentUser!;
  const newAnn: Announcement = {
    id: `ann-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    category: category || 'General',
    target_audience: target_audience || 'ALL',
    author_name: user.name,
    author_role: user.role,
    pinned: pinned ?? false,
    created_at: new Date().toISOString(),
  };

  db.announcements.unshift(newAnn);

  // Notify target audience
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'system_announcement',
    title: `Announcement: ${newAnn.title}`,
    message: newAnn.content.substring(0, 90) + '...',
    timestamp: 'Just now',
    read: false,
    targetTab: 'announcements',
    recipient_role: newAnn.target_audience === 'TEACHERS' ? 'TEACHER' : newAnn.target_audience === 'STUDENTS' ? 'STUDENT' : 'ALL',
  });

  saveDB();
  res.status(201).json(newAnn);
});

app.delete('/api/announcements/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  db.announcements = db.announcements.filter((a) => a.id !== id);
  saveDB();
  res.json({ message: 'Announcement deleted', id });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  const user = req.currentUser;
  if (!user) return res.json(db.notifications);

  const filtered = db.notifications.filter((n) => {
    if (n.recipient_id && n.recipient_id === user.id) return true;
    if (n.recipient_role === 'ALL') return true;
    if (n.recipient_role === user.role) return true;
    return false;
  });

  res.json(filtered);
});

app.post('/api/notifications/mark-all-read', requireAuth, (req, res) => {
  db.notifications.forEach((n) => {
    n.read = true;
  });
  saveDB();
  res.json({ message: 'All notifications marked as read' });
});

// House Standings & Real-Time Overall Winner
app.get('/api/house-standings', (req, res) => {
  const houses = ['Red', 'Blue', 'Green', 'Yellow'] as const;
  const standings = houses.map((house) => {
    const studentCount = db.students.filter((s) => s.house === house).length;
    const studentIds = new Set(db.students.filter((s) => s.house === house).map((s) => s.student_id));
    const houseAchievements = db.achievements.filter((a) => studentIds.has(a.student_id));
    const houseParts = db.participations.filter((p) => studentIds.has(p.student_id));

    let achPoints = 0;
    houseAchievements.forEach((a) => {
      achPoints += POINT_SYSTEM.achievements[a.level as keyof typeof POINT_SYSTEM.achievements] || 10;
    });

    const partPoints = houseParts.length * POINT_SYSTEM.participation;
    const totalPoints = achPoints + partPoints;

    return {
      house,
      studentCount,
      participationCount: houseParts.length,
      achievementCount: houseAchievements.length,
      achievementPoints: achPoints,
      participationPoints: partPoints,
      totalPoints,
    };
  });

  standings.sort((a, b) => b.totalPoints - a.totalPoints);
  const ranked = standings.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  const overallWinner = ranked[0];

  res.json({
    standings: ranked,
    overallWinner: {
      house: overallWinner.house,
      totalPoints: overallWinner.totalPoints,
      message: `🏆 Overall Winner: ${overallWinner.house} House — ${overallWinner.house} House has secured the highest overall score with ${overallWinner.totalPoints} points!`,
    },
  });
});

// Helper for checking time overlaps (e.g. "09:00" - "10:00" vs "09:30" - "10:30")
function isTimeOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && e1 > s2;
}

// ==========================================
// SMART CALENDAR API
// ==========================================

app.get('/api/calendar', (req, res) => {
  const user = req.currentUser;
  const { department, year, section, category, month, search } = req.query as Record<string, string>;

  // Build unified calendar items list
  let items: CalendarEvent[] = [...db.calendar_events];

  // Auto-integrate College Events into calendar
  db.events.forEach((evt) => {
    const timeParts = (evt.event_time || '10:00 AM - 04:00 PM').split('-');
    const startTime = timeParts[0]?.trim() || '10:00';
    const endTime = timeParts[1]?.trim() || '16:00';
    
    items.push({
      id: `evt-cal-${evt.id}`,
      title: evt.name,
      category: 'Event',
      date: evt.date,
      start_time: startTime.includes(':') ? startTime : '10:00',
      end_time: endTime.includes(':') ? endTime : '16:00',
      location: evt.venue || 'Campus Auditorium',
      department: evt.department as any,
      target_audience: evt.event_scope === 'COLLEGE' ? 'ALL' : evt.department,
      description: evt.description,
      organizer: evt.organizer || 'College Committee',
      status: evt.status === 'Completed' ? 'Completed' : evt.status === 'Ongoing' ? 'Ongoing' : 'Scheduled',
      related_id: evt.id,
    });
  });

  // Auto-integrate Assignments by due date
  db.assignments.forEach((asg) => {
    items.push({
      id: `asg-cal-${asg.id}`,
      title: `Assignment Due: ${asg.title}`,
      category: 'Assignment',
      date: asg.due_date,
      start_time: '09:00',
      end_time: '23:59',
      location: 'Online Submission Portal',
      target_audience: asg.class_name,
      description: `${asg.subject_name} • Max Marks: ${asg.max_marks} pts • ${asg.instructions || asg.description}`,
      organizer: asg.teacher_name,
      status: asg.status === 'Active' ? 'Scheduled' : 'Completed',
      related_id: asg.id,
    });
  });

  // Auto-integrate Exams
  db.exams.forEach((ex) => {
    items.push({
      id: `ex-cal-${ex.id}`,
      title: `${ex.name}: ${ex.subject_name} (${ex.subject_code || ''})`,
      category: 'Exam',
      date: ex.date,
      start_time: ex.start_time,
      end_time: ex.end_time,
      location: ex.room || 'Exam Hall',
      department: ex.department,
      year: ex.year,
      section: ex.section,
      target_audience: `${ex.year} ${ex.department} ${ex.section}`,
      description: `Official ${ex.name} for ${ex.year} ${ex.department} ${ex.section}. Max Marks: ${ex.max_marks || 50}.`,
      organizer: 'Academic Examination Cell',
      status: 'Scheduled',
      related_id: ex.id,
    });
  });

  // Auto-integrate Holidays
  db.holidays.forEach((hol) => {
    items.push({
      id: `hol-cal-${hol.id}`,
      title: `🏖️ ${hol.name} (${hol.type})`,
      category: 'Holiday',
      date: hol.date,
      start_time: '00:00',
      end_time: '23:59',
      location: 'Campus-wide',
      target_audience: 'ALL',
      description: hol.description || `${hol.type} observation. Classes suspended.`,
      status: 'Scheduled',
      related_id: hol.id,
    });
  });

  // Role-based filtering & Privacy enforcement
  if (user && user.role === 'STUDENT') {
    const student = db.students.find(
      (s) => s.student_id.toLowerCase() === (user.student_id || '').toLowerCase()
    );
    const studentDept = student?.department || 'CSE';
    const studentYear = student?.year || '1st Year';
    const studentSection = student?.section || 'Section A';
    const studentClass = `${studentYear} ${studentDept} ${studentSection}`;

    items = items.filter((item) => {
      if (item.category === 'Holiday') return true;
      if (!item.target_audience || item.target_audience === 'ALL' || item.target_audience === 'STUDENTS') return true;
      if (item.target_audience === studentDept || item.department === studentDept || item.department === 'ALL') return true;
      if (item.target_audience === studentYear || item.year === studentYear || item.year === 'ALL') return true;
      if (item.target_audience === studentClass) return true;
      if (item.target_audience.includes(studentDept) && item.target_audience.includes(studentYear)) return true;
      return false;
    });
  } else if (user && user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    const assignedClasses = teacher?.assigned_classes || [];
    const teacherDept = teacher?.department || 'CSE';

    items = items.filter((item) => {
      if (item.category === 'Holiday') return true;
      if (!item.target_audience || item.target_audience === 'ALL' || item.target_audience === 'TEACHERS') return true;
      if (item.target_audience === teacherDept || item.department === teacherDept) return true;
      if (assignedClasses.some((c) => item.target_audience?.includes(c))) return true;
      if (item.organizer === user.name || item.created_by === user.id) return true;
      return false;
    });
  }

  // Parameter-based filters
  if (category && category !== 'All') {
    items = items.filter((i) => i.category === category);
  }
  if (department && department !== 'All') {
    items = items.filter((i) => i.department === department || i.target_audience?.includes(department) || i.target_audience === 'ALL');
  }
  if (year && year !== 'All') {
    items = items.filter((i) => i.year === year || i.target_audience?.includes(year) || i.target_audience === 'ALL');
  }
  if (section && section !== 'All') {
    items = items.filter((i) => i.section === section || i.target_audience?.includes(section) || i.target_audience === 'ALL');
  }
  if (month) {
    items = items.filter((i) => i.date.startsWith(month));
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.location && i.location.toLowerCase().includes(q)) ||
        (i.organizer && i.organizer.toLowerCase().includes(q))
    );
  }

  // Sort chronologically
  items.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.start_time.localeCompare(b.start_time);
  });

  res.json(items);
});

app.post('/api/calendar', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { title, category, date, start_time, end_time, location, description, department, year, section, target_audience } = req.body;

  if (!title || !category || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Title, category, date, start time, and end time are required' });
  }

  if (start_time >= end_time) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  const user = req.currentUser!;
  const newCalEvent: CalendarEvent = {
    id: `calevt-${Date.now()}`,
    title: title.trim(),
    category: category || 'Event',
    date,
    start_time,
    end_time,
    location: location ? location.trim() : 'Main Campus',
    description: description ? description.trim() : '',
    department: department || 'ALL',
    year: year || 'ALL',
    section: section || 'ALL',
    target_audience: target_audience || 'ALL',
    created_by: user.id,
    organizer: user.name,
    status: 'Scheduled',
  };

  db.calendar_events.unshift(newCalEvent);

  // Broadcast notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'calendar_event_created',
    title: `Calendar Event: ${newCalEvent.title}`,
    message: `${newCalEvent.title} scheduled on ${newCalEvent.date} at ${newCalEvent.start_time}.`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'calendar',
    recipient_role: newCalEvent.target_audience === 'TEACHERS' ? 'TEACHER' : newCalEvent.target_audience === 'STUDENTS' ? 'STUDENT' : 'ALL',
  });

  saveDB();
  res.status(201).json(newCalEvent);
});

app.put('/api/calendar/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.calendar_events.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Calendar event not found' });
  }

  const existing = db.calendar_events[index];
  const { title, category, date, start_time, end_time, location, description, department, year, section, target_audience, status } = req.body;

  if (start_time && end_time && start_time >= end_time) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  const updated: CalendarEvent = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    category: category || existing.category,
    date: date || existing.date,
    start_time: start_time || existing.start_time,
    end_time: end_time || existing.end_time,
    location: location !== undefined ? location.trim() : existing.location,
    description: description !== undefined ? description.trim() : existing.description,
    department: department || existing.department,
    year: year || existing.year,
    section: section || existing.section,
    target_audience: target_audience || existing.target_audience,
    status: status || existing.status,
  };

  db.calendar_events[index] = updated;
  saveDB();
  res.json(updated);
});

app.delete('/api/calendar/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  db.calendar_events = db.calendar_events.filter((e) => e.id !== id);
  saveDB();
  res.json({ message: 'Calendar event deleted', id });
});

// Direct HTTP .ics file export endpoint for calendar events
app.get('/api/calendar/export.ics', (req, res) => {
  const user = req.currentUser;
  let items = [...db.calendar_events];

  // Auto-integrate Events, Assignments, Exams, Holidays
  db.events.forEach((evt) => {
    items.push({
      id: `evt-cal-${evt.id}`,
      title: evt.name,
      category: 'Event',
      date: evt.date,
      start_time: '10:00',
      end_time: '16:00',
      location: evt.venue || 'Campus Auditorium',
      department: evt.department as any,
      target_audience: evt.event_scope === 'COLLEGE' ? 'ALL' : evt.department,
      description: evt.description,
      organizer: evt.organizer || 'College Committee',
      status: 'Scheduled',
    });
  });

  db.assignments.forEach((asg) => {
    items.push({
      id: `asg-cal-${asg.id}`,
      title: `Assignment Due: ${asg.title}`,
      category: 'Assignment',
      date: asg.due_date,
      start_time: '09:00',
      end_time: '23:59',
      location: 'Online Portal',
      target_audience: asg.class_name,
      description: `${asg.subject_name} • Max Marks: ${asg.max_marks}`,
      status: 'Scheduled',
    });
  });

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//COMPORA//Academic Calendar 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:COMPORA Collegiate Calendar',
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  items.forEach((evt) => {
    const cleanDate = evt.date.replace(/-/g, '');
    const startTime = (evt.start_time || '09:00').replace(/:/g, '').padEnd(4, '0') + '00';
    const endTime = (evt.end_time || '10:00').replace(/:/g, '').padEnd(4, '0') + '00';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:evt-${evt.id}@compora.college.edu`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${cleanDate}T${startTime}`);
    lines.push(`DTEND:${cleanDate}T${endTime}`);
    lines.push(`SUMMARY:${evt.title.replace(/[,;\\]/g, ' ')}`);
    lines.push(`DESCRIPTION:${(evt.description || '').replace(/[,;\\]/g, ' ')}`);
    if (evt.location) lines.push(`LOCATION:${evt.location.replace(/[,;\\]/g, ' ')}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const icsText = lines.join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="compora_academic_calendar.ics"');
  res.send(icsText);
});

// ==========================================
// TIMETABLE API (WITH CONFLICT DETECTION)
// ==========================================

app.get('/api/timetable', (req, res) => {
  const user = req.currentUser;
  const { department, year, section, day, teacher_id } = req.query as Record<string, string>;

  let list = [...db.timetable_entries];

  // Role-based filtering
  if (user && user.role === 'STUDENT') {
    const student = db.students.find(
      (s) => s.student_id.toLowerCase() === (user.student_id || '').toLowerCase()
    );
    const sDept = student?.department || 'CSE';
    const sYear = student?.year || '1st Year';
    const sSec = student?.section || 'Section A';

    list = list.filter((t) => t.department === sDept && t.year === sYear && (t.section === sSec || t.section === 'A' || t.section === 'B'));
  } else if (user && user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    if (teacher) {
      list = list.filter((t) => t.teacher_id === teacher.id || t.teacher_name.toLowerCase() === teacher.name.toLowerCase());
    }
  }

  // Explicit query filters (e.g. for Admin / View selector)
  if (department && department !== 'All') {
    list = list.filter((t) => t.department === department);
  }
  if (year && year !== 'All') {
    list = list.filter((t) => t.year === year);
  }
  if (section && section !== 'All') {
    list = list.filter((t) => t.section === section);
  }
  if (day && day !== 'All') {
    list = list.filter((t) => t.day === day);
  }
  if (teacher_id && teacher_id !== 'All') {
    list = list.filter((t) => t.teacher_id === teacher_id);
  }

  // Sort by day and time
  const dayOrder: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  list.sort((a, b) => {
    const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  res.json(list);
});

app.post('/api/timetable', requireRole('ADMIN'), (req, res) => {
  const {
    day,
    start_time,
    end_time,
    department,
    year,
    section,
    subject_name,
    subject_code,
    teacher_name,
    teacher_id,
    room,
    semester,
  } = req.body;

  if (!day || !start_time || !end_time || !department || !year || !section || !subject_name || !teacher_name || !room) {
    return res.status(400).json({ error: 'All fields (day, times, dept, year, section, subject, teacher, room) are required' });
  }

  if (start_time >= end_time) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // ==========================================
  // CONFLICT DETECTION ENGINE
  // ==========================================

  // Check 1: Teacher Conflict
  const teacherConflict = db.timetable_entries.find(
    (t) =>
      t.day === day &&
      (t.teacher_id === teacher_id || t.teacher_name.toLowerCase() === teacher_name.toLowerCase()) &&
      isTimeOverlap(t.start_time, t.end_time, start_time, end_time)
  );
  if (teacherConflict) {
    return res.status(409).json({
      error: `Schedule conflict detected: Faculty "${teacher_name}" is already assigned to teach ${teacherConflict.subject_name} (${teacherConflict.year} ${teacherConflict.department} ${teacherConflict.section}) on ${day} from ${teacherConflict.start_time} to ${teacherConflict.end_time} in Room ${teacherConflict.room}.`,
    });
  }

  // Check 2: Class Cohort Conflict
  const classConflict = db.timetable_entries.find(
    (t) =>
      t.day === day &&
      t.department === department &&
      t.year === year &&
      t.section === section &&
      isTimeOverlap(t.start_time, t.end_time, start_time, end_time)
  );
  if (classConflict) {
    return res.status(409).json({
      error: `Schedule conflict detected: Cohort "${year} ${department} ${section}" already has "${classConflict.subject_name}" scheduled on ${day} from ${classConflict.start_time} to ${classConflict.end_time}.`,
    });
  }

  // Check 3: Room Occupancy Conflict
  const roomConflict = db.timetable_entries.find(
    (t) =>
      t.day === day &&
      t.room.toLowerCase().trim() === room.toLowerCase().trim() &&
      isTimeOverlap(t.start_time, t.end_time, start_time, end_time)
  );
  if (roomConflict) {
    return res.status(409).json({
      error: `Schedule conflict detected: Room "${room}" is already reserved for "${roomConflict.subject_name}" (${roomConflict.year} ${roomConflict.department} ${roomConflict.section}) on ${day} from ${roomConflict.start_time} to ${roomConflict.end_time}.`,
    });
  }

  const subject = db.subjects.find((s) => s.name === subject_name);

  const newEntry: TimetableEntry = {
    id: `tt-${Date.now()}`,
    day,
    start_time,
    end_time,
    department,
    year,
    section,
    subject_id: subject?.id || `sub-${Date.now()}`,
    subject_name,
    subject_code: subject_code || subject?.code || 'CS2001',
    teacher_id: teacher_id || 'STF001',
    teacher_name,
    room: room.trim(),
    semester: semester || 'Semester 1',
    academic_year: '2025-2026',
  };

  db.timetable_entries.push(newEntry);
  saveDB();
  res.status(201).json(newEntry);
});

app.put('/api/timetable/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.timetable_entries.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Timetable entry not found' });
  }

  const {
    day,
    start_time,
    end_time,
    department,
    year,
    section,
    subject_name,
    subject_code,
    teacher_name,
    teacher_id,
    room,
    semester,
  } = req.body;

  if (start_time && end_time && start_time >= end_time) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // Conflict Detection excluding self
  const otherEntries = db.timetable_entries.filter((t) => t.id !== id);

  const targetDay = day || db.timetable_entries[index].day;
  const targetStart = start_time || db.timetable_entries[index].start_time;
  const targetEnd = end_time || db.timetable_entries[index].end_time;
  const targetTeacherId = teacher_id || db.timetable_entries[index].teacher_id;
  const targetTeacherName = teacher_name || db.timetable_entries[index].teacher_name;
  const targetDept = department || db.timetable_entries[index].department;
  const targetYear = year || db.timetable_entries[index].year;
  const targetSection = section || db.timetable_entries[index].section;
  const targetRoom = room || db.timetable_entries[index].room;

  // Teacher clash
  const teacherConflict = otherEntries.find(
    (t) =>
      t.day === targetDay &&
      (t.teacher_id === targetTeacherId || t.teacher_name.toLowerCase() === targetTeacherName.toLowerCase()) &&
      isTimeOverlap(t.start_time, t.end_time, targetStart, targetEnd)
  );
  if (teacherConflict) {
    return res.status(409).json({
      error: `Schedule conflict detected: Faculty "${targetTeacherName}" is already teaching ${teacherConflict.subject_name} (${teacherConflict.year} ${teacherConflict.department} ${teacherConflict.section}) on ${targetDay} from ${teacherConflict.start_time} to ${teacherConflict.end_time}.`,
    });
  }

  // Class clash
  const classConflict = otherEntries.find(
    (t) =>
      t.day === targetDay &&
      t.department === targetDept &&
      t.year === targetYear &&
      t.section === targetSection &&
      isTimeOverlap(t.start_time, t.end_time, targetStart, targetEnd)
  );
  if (classConflict) {
    return res.status(409).json({
      error: `Schedule conflict detected: Cohort "${targetYear} ${targetDept} ${targetSection}" already has "${classConflict.subject_name}" scheduled on ${targetDay} from ${classConflict.start_time} to ${classConflict.end_time}.`,
    });
  }

  // Room clash
  const roomConflict = otherEntries.find(
    (t) =>
      t.day === targetDay &&
      t.room.toLowerCase().trim() === targetRoom.toLowerCase().trim() &&
      isTimeOverlap(t.start_time, t.end_time, targetStart, targetEnd)
  );
  if (roomConflict) {
    return res.status(409).json({
      error: `Schedule conflict detected: Room "${targetRoom}" is already reserved for "${roomConflict.subject_name}" (${roomConflict.year} ${roomConflict.department} ${roomConflict.section}) on ${targetDay} from ${roomConflict.start_time} to ${roomConflict.end_time}.`,
    });
  }

  const updated: TimetableEntry = {
    ...db.timetable_entries[index],
    day: targetDay,
    start_time: targetStart,
    end_time: targetEnd,
    department: targetDept,
    year: targetYear,
    section: targetSection,
    subject_name: subject_name || db.timetable_entries[index].subject_name,
    subject_code: subject_code || db.timetable_entries[index].subject_code,
    teacher_name: targetTeacherName,
    teacher_id: targetTeacherId,
    room: targetRoom,
    semester: semester || db.timetable_entries[index].semester,
  };

  db.timetable_entries[index] = updated;
  saveDB();
  res.json(updated);
});

app.delete('/api/timetable/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  db.timetable_entries = db.timetable_entries.filter((t) => t.id !== id);
  saveDB();
  res.json({ message: 'Timetable entry deleted', id });
});

// ==========================================
// EXAMS API
// ==========================================

app.get('/api/exams', (req, res) => {
  const user = req.currentUser;
  let list = [...db.exams];

  if (user && user.role === 'STUDENT') {
    const student = db.students.find(
      (s) => s.student_id.toLowerCase() === (user.student_id || '').toLowerCase()
    );
    if (student) {
      list = list.filter((e) => e.department === student.department && e.year === student.year);
    }
  }

  res.json(list);
});

app.post('/api/exams', requireRole('ADMIN', 'TEACHER'), (req, res) => {
  const { name, subject_name, subject_code, department, year, section, date, start_time, end_time, room, max_marks } = req.body;

  if (!name || !subject_name || !department || !year || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Exam name, subject, dept, year, date, and times are required' });
  }

  const newExam: ExamSchedule = {
    id: `ex-${Date.now()}`,
    name: name.trim(),
    subject_id: `sub-${Date.now()}`,
    subject_name: subject_name.trim(),
    subject_code: subject_code || 'CS1001',
    department,
    year,
    section: section || 'Section A',
    date,
    start_time,
    end_time,
    room: room ? room.trim() : 'Exam Hall 1',
    max_marks: Number(max_marks) || 50,
  };

  db.exams.unshift(newExam);

  // Notify students
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'exam_scheduled',
    title: `Exam Scheduled: ${newExam.name}`,
    message: `${newExam.subject_name} scheduled on ${newExam.date} at ${newExam.start_time} (${newExam.room}).`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'calendar',
    recipient_role: 'STUDENT',
  });

  saveDB();
  res.status(201).json(newExam);
});

app.delete('/api/exams/:id', requireRole('ADMIN', 'TEACHER'), (req, res) => {
  const { id } = req.params;
  db.exams = db.exams.filter((e) => e.id !== id);
  saveDB();
  res.json({ message: 'Exam schedule deleted', id });
});

// ==========================================
// HOLIDAYS API
// ==========================================

app.get('/api/holidays', (req, res) => {
  res.json(db.holidays);
});

app.post('/api/holidays', requireRole('ADMIN'), (req, res) => {
  const { name, type, date, end_date, description } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'Holiday name and date are required' });
  }

  const newHoliday: Holiday = {
    id: `hol-${Date.now()}`,
    name: name.trim(),
    type: type || 'College Holiday',
    date,
    end_date: end_date || undefined,
    description: description ? description.trim() : '',
  };

  db.holidays.unshift(newHoliday);

  // Broadcast announcement & notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'holiday_notice',
    title: `Holiday Declared: ${newHoliday.name}`,
    message: `${newHoliday.name} on ${newHoliday.date}. Regular campus operations suspended.`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'calendar',
    recipient_role: 'ALL',
  });

  saveDB();
  res.status(201).json(newHoliday);
});

app.delete('/api/holidays/:id', requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  db.holidays = db.holidays.filter((h) => h.id !== id);
  saveDB();
  res.json({ message: 'Holiday deleted', id });
});

// Events CRUD & Direct Student Registration
app.get('/api/events', (req, res) => {
  res.json(db.events);
});

app.post('/api/events', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { name, department, date, description, category, venue, event_scope, is_external, external_link, organizer, registration_deadline, eligibility, event_time } = req.body;
  if (!name || !department || !date || !description) {
    return res.status(400).json({ error: 'Name, department, date, and description are required' });
  }

  const user = req.currentUser!;
  if (user.role === 'TEACHER') {
    const teacher = db.teachers.find(
      (t) => t.user_id === user.id || t.name.toLowerCase() === user.name.toLowerCase()
    );
    if (teacher && teacher.can_publish_events === false) {
      return res.status(403).json({
        error: 'Permission Denied: You do not have event publishing permissions. Please contact your college administrator.',
      });
    }
  }

  const newEvent: CollegeEvent = {
    id: `evt-${Date.now()}`,
    name: name.trim(),
    department,
    date,
    description: description.trim(),
    category: category || 'Technical',
    venue: venue || 'Campus Main Hall',
    status: req.body.status || 'Upcoming',
    event_scope: event_scope || (is_external ? 'EXTERNAL' : 'COLLEGE'),
    is_external: is_external ?? (event_scope === 'EXTERNAL'),
    external_link: external_link || undefined,
    organizer: organizer || user.name,
    registration_deadline: registration_deadline || undefined,
    eligibility: eligibility || 'Open to all students',
    event_time: event_time || '10:00 AM - 04:00 PM',
  };

  db.events.unshift(newEvent);

  // Notify students
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'event_created',
    title: `New ${newEvent.event_scope === 'EXTERNAL' ? 'External ' : ''}Event: ${newEvent.name}`,
    message: `${newEvent.name} is scheduled on ${newEvent.date}. Registration is now open!`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'events',
    recipient_role: 'ALL',
  });

  saveDB();
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.events.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.events[index] = { ...db.events[index], ...req.body, id };
  saveDB();
  res.json(db.events[index]);
});

app.delete('/api/events/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.events.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.events = db.events.filter((e) => e.id !== id);
  db.participations = db.participations.filter((p) => p.event_id !== id);
  saveDB();
  res.json({ message: 'Event deleted', id });
});

// Direct Student Event Participation / Registration (Flow: Click Register -> Duplicate check -> Confirm)
app.post('/api/events/:id/register', requireAuth, (req, res) => {
  const { id } = req.params;
  const event = db.events.find((e) => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const user = req.currentUser!;
  const studentId = req.body.student_id || user.student_id;
  if (!studentId) {
    return res.status(400).json({ error: 'Student registration requires an active student record or student_id' });
  }

  const student = db.students.find((s) => s.student_id.toLowerCase() === studentId.toLowerCase());
  if (!student) {
    return res.status(404).json({ error: `Student "${studentId}" not found in college directory` });
  }

  // Prevent duplicate registration
  const alreadyRegistered = db.participations.some(
    (p) => p.event_id === id && p.student_id.toLowerCase() === studentId.toLowerCase()
  );
  if (alreadyRegistered) {
    return res.status(400).json({
      error: `You are already registered for "${event.name}". Duplicate participation is prevented.`,
    });
  }

  const participation: EventParticipation = {
    id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    event_id: id,
    student_id: student.student_id,
    registered_at: new Date().toISOString(),
    role: 'Participant',
  };

  db.participations.push(participation);

  // Notify student
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'participation_updated',
    title: `Registration Confirmed: ${event.name}`,
    message: `You are confirmed as a participant for ${event.name} representing House ${student.house}.`,
    timestamp: 'Just now',
    read: false,
    targetTab: 'student_participation',
    recipient_role: 'STUDENT',
  });

  saveDB();
  res.status(201).json({
    message: `Successfully registered for ${event.name}!`,
    participation,
    event,
  });
});

// Event Participants Management
app.get('/api/events/:id/participants', (req, res) => {
  const { id } = req.params;
  const parts = db.participations.filter((p) => p.event_id === id);
  res.json(parts);
});

app.post('/api/events/:id/participants', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const { student_ids } = req.body;

  if (!Array.isArray(student_ids)) {
    return res.status(400).json({ error: 'student_ids must be an array' });
  }

  db.participations = db.participations.filter((p) => p.event_id !== id);

  const newParts: EventParticipation[] = student_ids.map((sId: string) => ({
    id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    event_id: id,
    student_id: sId,
    registered_at: new Date().toISOString(),
    role: 'Participant',
  }));

  db.participations.push(...newParts);
  saveDB();

  res.json({
    message: 'Participants updated successfully',
    eventId: id,
    count: newParts.length,
    participants: newParts,
  });
});

// Achievements CRUD
app.get('/api/achievements', (req, res) => {
  const user = req.currentUser;
  // If student: only show own verified achievements
  if (user && user.role === 'STUDENT') {
    const sId = user.student_id?.toLowerCase() || '';
    return res.json(db.achievements.filter((a) => a.student_id.toLowerCase() === sId));
  }
  res.json(db.achievements);
});

app.post('/api/achievements', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { student_id, title, category, level, date, description } = req.body;
  if (!student_id || !title || !category || !level || !date) {
    return res.status(400).json({ error: 'Missing required achievement fields' });
  }

  const studentExists = db.students.some((s) => s.student_id.toLowerCase() === student_id.toLowerCase());
  if (!studentExists) {
    return res.status(400).json({ error: `Student ID ${student_id} does not exist in student directory` });
  }

  const newAchievement: Achievement = {
    id: `ach-${Date.now()}`,
    student_id: student_id.trim().toUpperCase(),
    title: title.trim(),
    category,
    level,
    date,
    description: description ? description.trim() : '',
  };

  db.achievements.unshift(newAchievement);
  saveDB();
  res.status(201).json(newAchievement);
});

app.put('/api/achievements/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  const index = db.achievements.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  db.achievements[index] = { ...db.achievements[index], ...req.body, id };
  saveDB();
  res.json(db.achievements[index]);
});

app.delete('/api/achievements/:id', requireRole('TEACHER', 'ADMIN'), (req, res) => {
  const { id } = req.params;
  db.achievements = db.achievements.filter((a) => a.id !== id);
  saveDB();
  res.json({ message: 'Achievement deleted', id });
});

// Seed Batch / Scale generator (Admin only)
app.post('/api/seed-batch', requireRole('ADMIN'), (req, res) => {
  const count = Number(req.body.count) || 25;
  const firstNames = ['Arun', 'Priya', 'Kavitha', 'Siddharth', 'Nisha', 'Ganesh', 'Deepa', 'Vinod', 'Anusha', 'Kiran', 'Madhav', 'Pooja', 'Suresh', 'Bhavna', 'Gokul', 'Archana', 'Ashok', 'Tejaswini', 'Naveen', 'Meenakshi'];
  const lastNames = ['Murugan', 'Karthik', 'Nadar', 'Bhat', 'Patel', 'Nambiar', 'Raman', 'Chari', 'Subramanian', 'Reddy', 'Gowda', 'Verma', 'Singh', 'Desai', 'Pillai', 'Rao', 'Iyer', 'Shenoy'];
  const depts = ['CSE', 'IT', 'CSBS', 'BME', 'Mechanical', 'ECE', 'EEE', 'Civil', 'AI&DS'] as const;
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const;
  const houses = ['Red', 'Blue', 'Green', 'Yellow'] as const;

  const generatedStudents: Student[] = [];
  const existingCount = db.students.length;

  for (let i = 0; i < count; i++) {
    const f = firstNames[Math.floor(Math.random() * firstNames.length)];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const yr = years[Math.floor(Math.random() * years.length)];
    const house = houses[Math.floor(Math.random() * houses.length)];
    const yrPrefix = yr.startsWith('1') ? '24' : yr.startsWith('2') ? '23' : yr.startsWith('3') ? '22' : '21';
    const deptCode = dept === 'CSE' ? 'CS' : dept === 'IT' ? 'IT' : dept === 'AI&DS' ? 'AD' : dept === 'ECE' ? 'EC' : dept === 'EEE' ? 'EE' : dept === 'Mechanical' ? 'ME' : dept === 'Civil' ? 'CE' : dept === 'BME' ? 'BM' : 'CB';
    const num = String(existingCount + i + 101).padStart(3, '0');
    const sId = `${yrPrefix}${deptCode}${num}`;

    generatedStudents.push({
      id: `std-batch-${Date.now()}-${i}`,
      student_id: sId,
      name: `${f} ${l}`,
      department: dept,
      year: yr,
      section: dept === 'CSE' ? (Math.random() > 0.5 ? 'Section A' : 'Section B') : 'Section A',
      house,
      email: `${sId.toLowerCase()}@compora.edu`,
    });
  }

  db.students.push(...generatedStudents);
  saveDB();
  res.json({ message: `Successfully seeded ${count} students`, addedCount: count, totalStudents: db.students.length });
});

// Reset Data (Admin only - preserves user accounts)
app.post('/api/reset-data', requireRole('ADMIN'), (req, res) => {
  db = {
    students: [...INITIAL_STUDENTS],
    events: [...INITIAL_PORTAL_EVENTS],
    achievements: [...INITIAL_ACHIEVEMENTS],
    participations: [...INITIAL_PARTICIPATION],
    users: db.users.length > 0 ? db.users : createDefaultUsers(),
    teachers: [...INITIAL_TEACHERS],
    academic_classes: [...INITIAL_ACADEMIC_CLASSES],
    subjects: [...INITIAL_SUBJECTS],
    results: [...INITIAL_STUDENT_RESULTS],
    assignments: [...INITIAL_ASSIGNMENTS],
    submissions: [...INITIAL_ASSIGNMENT_SUBMISSIONS],
    announcements: [...INITIAL_ANNOUNCEMENTS],
    notifications: [...INITIAL_NOTIFICATIONS],
    calendar_events: [...SEED_CALENDAR_EVENTS],
    timetable_entries: [...SEED_TIMETABLE_ENTRIES],
    exams: [...SEED_EXAMS],
    holidays: [...SEED_HOLIDAYS],
  };
  saveDB();
  res.json({
    message: 'Database reset to initial college benchmark',
    counts: {
      students: db.students.length,
      events: db.events.length,
      achievements: db.achievements.length,
      participations: db.participations.length,
      users: db.users.length,
      teachers: db.teachers.length,
      classes: db.academic_classes.length,
      subjects: db.subjects.length,
      results: db.results.length,
      assignments: db.assignments.length,
      announcements: db.announcements.length,
    },
  });
});

// AI FEATURES
// 1. Student Performance Analysis
app.post('/api/ai/analyze-student', async (req, res) => {
  try {
    const { student_id } = req.body;
    const student = db.students.find((s) => s.student_id === student_id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentAchievements = db.achievements.filter((a) => a.student_id === student_id);
    const studentEvents = db.participations
      .filter((p) => p.student_id === student_id)
      .map((p) => {
        const ev = db.events.find((e) => e.id === p.event_id);
        return { event: ev?.name || p.event_id, role: p.role || 'Participant' };
      });

    // Compute basic scores
    let achPoints = 0;
    studentAchievements.forEach((a) => {
      achPoints += POINT_SYSTEM.achievements[a.level as keyof typeof POINT_SYSTEM.achievements] || 10;
    });
    const partPoints = studentEvents.length * POINT_SYSTEM.participation;
    const totalPoints = achPoints + partPoints;

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are the AI evaluation module for "COMPORA", a College Event, Participation & Achievement System.
Analyze this student's performance profile based on real academic records:
Student: ${student.name} (ID: ${student.student_id})
Department: ${student.department} | Year: ${student.year} | House: ${student.house} | Section: ${student.section}
Achievements (${studentAchievements.length}): ${JSON.stringify(studentAchievements.map((a) => ({ title: a.title, category: a.category, level: a.level })))}
Event Participations (${studentEvents.length}): ${JSON.stringify(studentEvents)}
Total Computed Activity Points: ${totalPoints} (Achievements: ${achPoints} pts, Participations: ${partPoints} pts)

Return a structured JSON with:
{
  "studentId": "${student.student_id}",
  "studentName": "${student.name}",
  "overallScore": number (out of 100 based on achievements & events),
  "activityQuotient": "Exceptional" | "High" | "Moderate" | "Needs Engagement",
  "strengths": ["array of 3-4 specific strengths based on their achievements"],
  "growthAreas": ["array of 2-3 specific growth suggestions"],
  "recommendedActivities": ["array of 3 college event types or hackathons tailored to their department & house"],
  "executiveSummary": "2-3 concise sentences summarizing their value to House ${student.house} and college track record."
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = aiResponse.text;
      if (text) {
        return res.json(JSON.parse(text));
      }
    }

    // Heuristic fallback
    const quotient = totalPoints > 50 ? 'Exceptional' : totalPoints > 25 ? 'High' : totalPoints > 10 ? 'Moderate' : 'Needs Engagement';
    res.json({
      studentId: student.student_id,
      studentName: student.name,
      overallScore: Math.min(100, Math.max(30, totalPoints * 1.5 + 20)),
      activityQuotient: quotient,
      strengths: [
        `Strong dedication representing House ${student.house}`,
        studentAchievements.length > 0 ? `Proven success in ${studentAchievements[0].category} tier competitions` : 'Consistent participation in campus activities',
        `Active representative of the ${student.department} department`,
      ],
      growthAreas: [
        'Expand participation into inter-departmental technical symposiums',
        'Aim for state and national level hackathons to earn high-tier house points',
      ],
      recommendedActivities: [
        `${student.department} Annual Code Debug & Prototype Sprint`,
        'Inter-House Leadership & Technical Debate',
        'National Level Project Innovation Expo',
      ],
      executiveSummary: `${student.name} has contributed ${totalPoints} activity points to House ${student.house}. Demonstrates strong potential in ${student.department} activities with great promise for upcoming college championships.`,
    });
  } catch (err: any) {
    console.error('AI student analysis error:', err);
    res.status(500).json({ error: err.message || 'AI analysis failed' });
  }
});

// 2. House Performance Analysis
app.post('/api/ai/house-analysis', async (req, res) => {
  try {
    const ai = getGeminiClient();

    // Prepare house summary from database
    const houseSummary = ['Red', 'Blue', 'Green', 'Yellow'].map((h) => {
      const studentCount = db.students.filter((s) => s.house === h).length;
      const studentIds = new Set(db.students.filter((s) => s.house === h).map((s) => s.student_id));
      const achs = db.achievements.filter((a) => studentIds.has(a.student_id));
      const parts = db.participations.filter((p) => studentIds.has(p.student_id));
      let achPts = 0;
      achs.forEach((a) => achPts += POINT_SYSTEM.achievements[a.level as keyof typeof POINT_SYSTEM.achievements] || 10);
      const partPts = parts.length * POINT_SYSTEM.participation;
      return {
        house: h,
        students: studentCount,
        participations: parts.length,
        achievements: achs.length,
        achievementPoints: achPts,
        participationPoints: partPts,
        totalPoints: achPts + partPts,
      };
    });

    houseSummary.sort((a, b) => b.totalPoints - a.totalPoints);
    const topHouse = houseSummary[0];

    if (ai) {
      const prompt = `You are the AI Sports & Activity Commissioner for COMPORA.
Analyze the current 4-House championship standings:
${JSON.stringify(houseSummary, null, 2)}
Scoring Rules: College=10pts, District=20pts, State=30pts, National=40pts, Event Participation=5pts each.

Return JSON in this format:
{
  "winningHouse": "${topHouse.house}",
  "winProbability": number between 60 and 95,
  "comparisons": [
    {
      "house": "Red",
      "momentum": "High" | "Surging" | "Stable" | "Trailing",
      "participationStrength": "string summarizing participation density",
      "achievementQuality": "string summarizing achievement tier",
      "strategicAdvice": "string of 1 actionable tactic to gain lead"
    },
    ... (for all 4 houses: Red, Blue, Green, Yellow)
  ],
  "overallVerdict": "2-3 analytical sentences explaining why ${topHouse.house} is currently in the lead and what the trailing houses must do in upcoming events."
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const text = aiResponse.text;
      if (text) {
        return res.json(JSON.parse(text));
      }
    }

    // Heuristic fallback
    res.json({
      winningHouse: topHouse.house,
      winProbability: 78,
      comparisons: houseSummary.map((h, i) => ({
        house: h.house,
        momentum: i === 0 ? 'Surging' : i === 1 ? 'High' : 'Stable',
        participationStrength: `${h.participations} recorded event entries across departments`,
        achievementQuality: `${h.achievements} competitive awards totalling ${h.achievementPoints} pts`,
        strategicAdvice: i === 0 ? 'Maintain student turnout in upcoming sports and cultural festivals.' : 'Mobilize 1st and 2nd year students for 5-point participation multipliers.',
      })),
      overallVerdict: `House ${topHouse.house} holds 1st place with ${topHouse.totalPoints} points due to a strong balance of high-level national achievements and consistent event registrations. House ${houseSummary[1]?.house} trails closely and could overturn the deficit in the next inter-house event.`,
    });
  } catch (err: any) {
    console.error('AI house analysis error:', err);
    res.status(500).json({ error: err.message || 'AI analysis failed' });
  }
});

// 3. AI Executive Report Generator
app.post('/api/ai/executive-report', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const totalStudents = db.students.length;
    const totalEvents = db.events.length;
    const totalAchievements = db.achievements.length;
    const totalParticipations = db.participations.length;

    if (ai) {
      const prompt = `You are the Dean of Student Affairs AI assistant in COMPORA.
Generate a comprehensive, formal executive activity & achievement report for college management.
Key Metrics:
- Total Enrolled Students Tracked: ${totalStudents}
- Total Inter & Intra College Events: ${totalEvents}
- Verified Student Achievements: ${totalAchievements}
- Total Event Participations Logged: ${totalParticipations}
- Departments: CSE, IT, CSBS, BME, Mechanical, ECE, EEE, Civil, AI&DS
- Houses: Red, Blue, Green, Yellow

Return JSON matching:
{
  "title": "COMPORA - Institutional Student Activity & Achievement Annual Report",
  "date": "${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}",
  "executiveSummary": "3-4 formal sentences detailing campus engagement and digital tracking impact.",
  "houseChampionshipReview": "2-3 sentences reviewing house competition intensity, point distribution, and leader status.",
  "departmentalHighlights": "2-3 sentences evaluating top performing departments (e.g. CSE, AI&DS, IT) and areas needing uplift.",
  "studentEngagementAssessment": "2-3 sentences evaluating academic year participation trends (1st to 4th year).",
  "actionableRecommendations": [
    "array of 4 strategic, institutional recommendations for the Academic Council and Sports/Cultural Board"
  ]
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (aiResponse.text) {
        return res.json(JSON.parse(aiResponse.text));
      }
    }

    // Heuristic fallback
    res.json({
      title: 'COMPORA - Institutional Student Activity & Achievement Annual Report',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      executiveSummary: `During the current academic cycle, COMPORA has centralized activity records across ${totalStudents} students, ${totalEvents} collegiate events, and ${totalAchievements} verified achievements. The digitized infrastructure has eliminated data silos and established clear accountability across all nine academic departments.`,
      houseChampionshipReview: `The four-house championship system (Red, Blue, Green, Yellow) has driven healthy inter-disciplinary camaraderie. Scoring algorithms factoring both participation volume (5 pts/entry) and achievement tier (10-40 pts) have kept competition competitive across all quarters.`,
      departmentalHighlights: `CSE and AI&DS have dominated technical hackathons and paper presentations, while Mechanical and Civil have shown remarkable strength in robotics and sustainable engineering design competitions.`,
      studentEngagementAssessment: `Engagement is highest among 3rd and 4th-year cohorts preparing for campus placements. Targeted initiatives are recommended to integrate 1st-year students earlier into departmental clubs.`,
      actionableRecommendations: [
        'Institute inter-departmental innovation hackathons every semester to incentivize cross-discipline teams.',
        'Reward high-performing houses with dedicated college sports and laboratory development grants.',
        'Implement peer-mentoring programs where senior national achievers guide junior students in competitive coding.',
        'Expand industry-sponsored prize categories in upcoming symposiums to boost district and state participation.',
      ],
    });
  } catch (err: any) {
    console.error('AI executive report error:', err);
    res.status(500).json({ error: err.message || 'AI report generation failed' });
  }
});

// Vite middleware in dev or static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 COMPORA server running on http://0.0.0.0:${PORT}`);
  });
}

start();
