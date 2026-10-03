import {
  Teacher,
  AcademicClass,
  Subject,
  StudentResult,
  Assignment,
  AssignmentSubmission,
  Announcement,
  CollegeEvent,
  NotificationItem,
} from '../types';
import { SEED_TEACHERS } from './seedTeachers';
import { SEED_ACADEMIC_CLASSES, SEED_SUBJECTS, SEED_RESULTS } from './seedAcademics';
import {
  SEED_ASSIGNMENTS,
  SEED_ASSIGNMENT_SUBMISSIONS,
  SEED_ANNOUNCEMENTS,
  SEED_EVENTS,
  SEED_NOTIFICATIONS,
} from './seedEvents';

export const INITIAL_TEACHERS: Teacher[] = [...SEED_TEACHERS];
export const INITIAL_ACADEMIC_CLASSES: AcademicClass[] = [...SEED_ACADEMIC_CLASSES];
export const INITIAL_SUBJECTS: Subject[] = [...SEED_SUBJECTS];
export const INITIAL_STUDENT_RESULTS: StudentResult[] = [...SEED_RESULTS];
export const INITIAL_ASSIGNMENTS: Assignment[] = [...SEED_ASSIGNMENTS];
export const INITIAL_ASSIGNMENT_SUBMISSIONS: AssignmentSubmission[] = [...SEED_ASSIGNMENT_SUBMISSIONS];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [...SEED_ANNOUNCEMENTS];
export const INITIAL_PORTAL_EVENTS: CollegeEvent[] = [...SEED_EVENTS];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [...SEED_NOTIFICATIONS];
