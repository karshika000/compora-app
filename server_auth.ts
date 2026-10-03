import crypto from 'crypto';
import { User, UserRole, Student, Teacher } from './src/types';
import { SEED_STUDENTS } from './src/data/seedStudents';
import { SEED_TEACHERS } from './src/data/seedTeachers';

export interface UserRecord extends User {
  password_hash: string;
}

export interface ActiveSession {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

/**
 * Secure password hashing using Node.js built-in scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Timing-safe password verification
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (e) {
    return false;
  }
}

/**
 * Strips sensitive fields like password_hash before returning to client
 */
export function sanitizeUser(user: UserRecord): User {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

/**
 * Generates default password formula:
 * first 4 letters of name in lowercase + '@' + birth year
 * Example: Yogakarshika (DOB 2005-04-01) -> yoga@2005
 */
export function generateDefaultPassword(name: string, birthYearOrDob: number | string): string {
  const withoutTitle = (name || '').replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Er\.)\s+/i, '').trim();
  const letters = withoutTitle.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const prefix = (letters.slice(0, 4) || 'user').padEnd(4, 'x');
  
  let year = 2005;
  if (typeof birthYearOrDob === 'number') {
    year = birthYearOrDob;
  } else if (typeof birthYearOrDob === 'string') {
    const match = birthYearOrDob.match(/\b(19\d\d|20\d\d)\b/);
    if (match) year = parseInt(match[1], 10);
  }
  return `${prefix}@${year}`;
}

/**
 * Full system user database with pre-hashed credentials:
 * - Admin: admin / admin123
 * - All Teachers (from SEED_TEACHERS)
 * - All Students (from SEED_STUDENTS)
 */
export function createDefaultUsers(): UserRecord[] {
  const users: UserRecord[] = [
    // 1. System Administrator
    {
      id: 'usr-admin-1',
      username: 'admin',
      email: 'admin@compora.edu',
      name: 'Dr. K. S. Ramanathan',
      role: 'ADMIN',
      status: 'Active',
      phone: '+91 98400 11223',
      created_at: new Date().toISOString(),
      password_hash: hashPassword('admin123'),
    },
  ];

  // 2. Add all faculty accounts
  SEED_TEACHERS.forEach((t) => {
    const staffId = t.staff_id || (t as any).staffId || t.id;
    const birthYear = t.birth_year || (t as any).birthYear || t.date_of_birth || 1985;
    const defaultPassword = generateDefaultPassword(t.name, birthYear);
    
    users.push({
      id: t.user_id || `usr-${staffId.toLowerCase()}`,
      username: staffId,
      email: t.email,
      name: t.name,
      role: 'TEACHER',
      status: t.status || 'Active',
      staff_id: staffId,
      teacher_id: t.id,
      department: t.department,
      date_of_birth: t.date_of_birth,
      phone: t.phone,
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword(defaultPassword),
    });
  });

  // 3. Add all student accounts
  SEED_STUDENTS.forEach((s) => {
    const birthYear = s.birth_year || (s as any).birthYear || s.date_of_birth || 2005;
    const defaultPassword = generateDefaultPassword(s.name, birthYear);

    users.push({
      id: `usr-${s.student_id.toLowerCase()}`,
      username: s.student_id,
      email: s.email || `${s.student_id.toLowerCase()}@compora.edu`,
      name: s.name,
      role: 'STUDENT',
      status: 'Active',
      student_id: s.student_id,
      department: s.department,
      date_of_birth: s.date_of_birth,
      phone: s.phone,
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword(defaultPassword),
    });
  });

  return users;
}
