import crypto from 'crypto';
import { User, UserRole } from './src/types';
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
 * first 4 letters of student's full name in lowercase + '@' + birth year
 * Example: Yogakarshika S (DOB 2005-04-01) -> yoga@2005
 */
export function generateDefaultPassword(name: string, birthYear: number): string {
  // Remove title prefixes like Dr., Prof., etc.
  const withoutTitle = name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  // Get first primary name word (ignoring trailing single letter initials)
  const firstWord = withoutTitle.split(/\s+/)[0] || withoutTitle;
  const clean = firstWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const prefix = (clean.slice(0, 4) || 'user').padEnd(4, 'x');
  return `${prefix}@${birthYear}`;
}

/**
 * Full system user database with pre-hashed credentials:
 * - Admin: admin / admin123
 * - 1 Teacher: Username = STF001, Initial Password = arun@1985 (DOB: 1985-07-15)
 * - 1 Student: Username = 26CSE001, Initial Password = yoga@2005 (DOB: 2005-04-01)
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

    // 2. Initial Faculty Account (STF001 / arun@1985)
    {
      id: 'usr-stf001',
      username: 'STF001',
      email: 'arun.kumar@compora.edu',
      name: 'Arun Kumar',
      role: 'TEACHER',
      status: 'Active',
      staff_id: 'STF001',
      teacher_id: 'teach-1',
      department: 'CSE',
      date_of_birth: '1985-07-15',
      phone: '+91 98401 22334',
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword('arun@1985'),
    },

    // 3. Initial Student Account (26CSE001 / yoga@2005)
    {
      id: 'usr-26cse001',
      username: '26CSE001',
      email: '26cse001@compora.edu',
      name: 'Yogakarshika',
      role: 'STUDENT',
      status: 'Active',
      student_id: '26CSE001',
      department: 'CSE',
      date_of_birth: '2005-04-01',
      phone: '+91 98401 23456',
      password_changed: false,
      created_at: new Date().toISOString(),
      password_hash: hashPassword('yoga@2005'),
    },
  ];

  return users;
}
