import { User, Student, Teacher, UserRole } from '../types';
import { SEED_STUDENTS } from '../data/seedStudents';
import { SEED_TEACHERS } from '../data/seedTeachers';

export interface UserRecord extends User {
  password_hash?: string;
  password?: string;
}

/**
 * Extracts 4-digit birth year from string or number
 */
export function extractBirthYear(dobOrYear?: string | number | null, defaultYear = 2005): number {
  if (typeof dobOrYear === 'number' && dobOrYear >= 1900 && dobOrYear <= 2099) {
    return dobOrYear;
  }
  if (typeof dobOrYear === 'string') {
    const match = dobOrYear.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return defaultYear;
}

/**
 * Extracts the first 4 lowercase letters of the primary name
 * (ignoring academic/honorific prefixes like Dr., Prof., etc.)
 */
export function extractFirstFourLetters(name: string): string {
  if (!name || typeof name !== 'string') return 'user';
  // Remove title prefixes like Dr., Prof., Mr., Mrs., Ms., Er.
  const withoutTitle = name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Er\.)\s+/i, '').trim();
  // Extract all letters from the cleaned name
  const letters = withoutTitle.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (letters.length >= 4) {
    return letters.slice(0, 4);
  }
  return letters.padEnd(4, 'x');
}

/**
 * Generates default password for student:
 * first four letters of full name in lowercase + @ + birth year
 * Example: Yogakarshika, DOB 2005-04-01 -> yoga@2005
 */
export function generateStudentPassword(name: string, dobOrYear?: string | number | null): string {
  const prefix = extractFirstFourLetters(name);
  const year = extractBirthYear(dobOrYear, 2005);
  return `${prefix}@${year}`;
}

/**
 * Generates default password for teacher:
 * first four letters of name in lowercase + @ + birth year
 * Example: Arun Kumar, DOB 1985-07-15 -> arun@1985
 */
export function generateTeacherPassword(name: string, dobOrYear?: string | number | null): string {
  const prefix = extractFirstFourLetters(name);
  const year = extractBirthYear(dobOrYear, 1985);
  return `${prefix}@${year}`;
}

export interface AuthSuccessResult {
  success: true;
  user: User;
  linkedStudent: Student | null;
  linkedTeacher: Teacher | null;
  token: string;
}

export interface AuthFailureResult {
  success: false;
  error: string;
}

export type AuthResult = AuthSuccessResult | AuthFailureResult;

/**
 * Universal authentication logic for COMPORA
 * Works seamlessly in client-side (Vercel static) and server-side contexts.
 */
export function authenticateCredentials(
  usernameInput: string,
  passwordInput: string,
  options?: {
    students?: Student[];
    teachers?: Teacher[];
    users?: UserRecord[];
  }
): AuthResult {
  const rawQuery = (usernameInput || '').trim();
  const query = rawQuery.toLowerCase();
  const password = (passwordInput || '').trim();
  const passwordLower = password.toLowerCase();

  if (!rawQuery || !password) {
    return { success: false, error: 'Username and password are required.' };
  }

  // 1. Check Administrator Account
  if (query === 'admin' || query === 'admin@compora.edu' || query === 'administrator') {
    const adminPasswords = ['admin123', 'admin', 'compora2026', 'admin@2026'];
    const isMatched = adminPasswords.includes(password) || adminPasswords.includes(passwordLower);
    if (isMatched) {
      const adminUser: User = {
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@compora.edu',
        name: 'Dr. K. S. Ramanathan',
        role: 'ADMIN',
        status: 'Active',
        phone: '+91 98400 11223',
        created_at: '2026-01-01T00:00:00.000Z',
        last_login: new Date().toISOString(),
      };
      return {
        success: true,
        user: adminUser,
        linkedStudent: null,
        linkedTeacher: null,
        token: `compora_auth_admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
    }
  }

  // 2. Check Custom/Stored User Records (if provided)
  const usersList = options?.users || [];
  const matchedUserRecord = usersList.find(
    (u) =>
      u.username.toLowerCase() === query ||
      u.email.toLowerCase() === query ||
      (u.student_id && u.student_id.toLowerCase() === query) ||
      (u.staff_id && u.staff_id.toLowerCase() === query)
  );

  if (matchedUserRecord && matchedUserRecord.status === 'Disabled') {
    return { success: false, error: 'This account has been disabled by the administrator.' };
  }

  // 3. Check Student Directory
  const studentList = (options?.students && options.students.length > 0)
    ? options.students
    : SEED_STUDENTS;

  const matchedStudent = studentList.find(
    (s) =>
      s.student_id.toLowerCase() === query ||
      (s.email && s.email.toLowerCase() === query) ||
      s.name.toLowerCase() === query
  );

  if (matchedStudent) {
    const expectedPassword = generateStudentPassword(
      matchedStudent.name,
      matchedStudent.birth_year ?? (matchedStudent as any).birthYear ?? matchedStudent.date_of_birth
    );

    const isPasswordCorrect =
      password === expectedPassword ||
      passwordLower === expectedPassword.toLowerCase() ||
      (matchedUserRecord && matchedUserRecord.password === password);

    if (isPasswordCorrect) {
      const studentUser: User = {
        id: matchedUserRecord?.id || `usr-${matchedStudent.student_id.toLowerCase()}`,
        username: matchedStudent.student_id,
        email: matchedStudent.email || `${matchedStudent.student_id.toLowerCase()}@compora.edu`,
        name: matchedStudent.name,
        role: 'STUDENT',
        status: 'Active',
        student_id: matchedStudent.student_id,
        department: matchedStudent.department,
        phone: matchedStudent.phone,
        date_of_birth: matchedStudent.date_of_birth,
        created_at: matchedUserRecord?.created_at || '2026-01-01T00:00:00.000Z',
        last_login: new Date().toISOString(),
      };

      return {
        success: true,
        user: studentUser,
        linkedStudent: matchedStudent,
        linkedTeacher: null,
        token: `compora_auth_std_${matchedStudent.student_id.toLowerCase()}_${Date.now()}`,
      };
    }
  }

  // 4. Check Teacher Directory
  const teacherList = (options?.teachers && options.teachers.length > 0)
    ? options.teachers
    : SEED_TEACHERS;

  const matchedTeacher = teacherList.find(
    (t) =>
      (t.staff_id && t.staff_id.toLowerCase() === query) ||
      ((t as any).staffId && (t as any).staffId.toLowerCase() === query) ||
      (t.id && t.id.toLowerCase() === query) ||
      (t.email && t.email.toLowerCase() === query) ||
      t.name.toLowerCase() === query
  );

  if (matchedTeacher) {
    const expectedPassword = generateTeacherPassword(
      matchedTeacher.name,
      matchedTeacher.birth_year ?? (matchedTeacher as any).birthYear ?? matchedTeacher.date_of_birth ?? 1985
    );

    const isPasswordCorrect =
      password === expectedPassword ||
      passwordLower === expectedPassword.toLowerCase() ||
      (matchedUserRecord && matchedUserRecord.password === password);

    if (isPasswordCorrect) {
      const staffIdVal = matchedTeacher.staff_id || (matchedTeacher as any).staffId || matchedTeacher.id;
      const teacherUser: User = {
        id: matchedTeacher.user_id || matchedUserRecord?.id || `usr-${staffIdVal.toLowerCase()}`,
        username: staffIdVal,
        email: matchedTeacher.email || `${staffIdVal.toLowerCase()}@compora.edu`,
        name: matchedTeacher.name,
        role: 'TEACHER',
        status: matchedTeacher.status || 'Active',
        staff_id: staffIdVal,
        teacher_id: matchedTeacher.id,
        department: matchedTeacher.department,
        phone: matchedTeacher.phone,
        date_of_birth: matchedTeacher.date_of_birth,
        created_at: matchedUserRecord?.created_at || '2026-01-01T00:00:00.000Z',
        last_login: new Date().toISOString(),
      };

      return {
        success: true,
        user: teacherUser,
        linkedStudent: null,
        linkedTeacher: matchedTeacher,
        token: `compora_auth_teach_${staffIdVal.toLowerCase()}_${Date.now()}`,
      };
    }
  }

  // 5. Fallback for custom user created in User Management
  if (matchedUserRecord && matchedUserRecord.password) {
    if (matchedUserRecord.password === password || matchedUserRecord.password.toLowerCase() === passwordLower) {
      const { password: _, password_hash: __, ...safeUser } = matchedUserRecord;
      return {
        success: true,
        user: safeUser,
        linkedStudent: matchedStudent || null,
        linkedTeacher: matchedTeacher || null,
        token: `compora_auth_usr_${safeUser.id}_${Date.now()}`,
      };
    }
  }

  return { success: false, error: 'Invalid username or password.' };
}
