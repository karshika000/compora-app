export type HouseName = 'Red' | 'Blue' | 'Green' | 'Yellow';
export type HouseColor = HouseName;

export type DepartmentName =
  | 'CSE'
  | 'IT'
  | 'CSBS'
  | 'BME'
  | 'Mechanical'
  | 'ECE'
  | 'EEE'
  | 'Civil'
  | 'AI&DS';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type AchievementLevel = 'College' | 'District' | 'State' | 'National';

export type AchievementCategory =
  | 'Technical'
  | 'Cultural'
  | 'Sports'
  | 'Academic'
  | 'Leadership'
  | 'Innovation';

export interface Student {
  id: string;
  student_id: string;
  name: string;
  department: DepartmentName;
  year: AcademicYear;
  section: string;
  house: HouseName;
  date_of_birth?: string; // YYYY-MM-DD
  birth_year?: number;
  email?: string;
  phone?: string;
}

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  category: AchievementCategory;
  level: AchievementLevel;
  date: string;
  description: string;
  points?: number;
}

export interface CollegeEvent {
  id: string;
  name: string;
  department: string;
  date: string;
  description: string;
  category?: string;
  venue?: string;
  status?: 'Upcoming' | 'Ongoing' | 'Completed';
  event_scope?: 'COLLEGE' | 'EXTERNAL';
  is_external?: boolean;
  external_link?: string;
  organizer?: string;
  registration_deadline?: string;
  eligibility?: string;
  event_time?: string;
}

export interface EventParticipation {
  id: string;
  event_id: string;
  student_id: string;
  registered_at?: string;
  role?: 'Participant' | 'Winner' | 'Runner-up' | 'Organizer';
}

export interface HouseStats {
  house: HouseName;
  studentCount: number;
  participationCount: number;
  achievementCount: number;
  achievementPoints: number;
  participationPoints: number;
  totalPoints: number;
  rank: number;
  topAchiever?: {
    name: string;
    student_id: string;
    points: number;
  };
}

export interface DepartmentStats {
  department: DepartmentName;
  studentCount: number;
  participationCount: number;
  achievementCount: number;
  achievementPoints: number;
}

export interface YearStats {
  year: AcademicYear;
  studentCount: number;
  participationCount: number;
  achievementCount: number;
}

export interface TopAchiever {
  student_id: string;
  name: string;
  department: DepartmentName;
  year: AcademicYear;
  house: HouseName;
  achievementCount: number;
  totalPoints: number;
}

export interface AIStudentAnalysis {
  studentId: string;
  studentName: string;
  overallScore: number;
  activityQuotient: string;
  strengths: string[];
  growthAreas: string[];
  recommendedActivities: string[];
  executiveSummary: string;
}

export interface AIHouseAnalysis {
  winningHouse: HouseName;
  winProbability: number;
  comparisons: {
    house: HouseName;
    momentum: string;
    participationStrength: string;
    achievementQuality: string;
    strategicAdvice: string;
  }[];
  overallVerdict: string;
}

export interface AIExecutiveReport {
  title: string;
  date: string;
  executiveSummary: string;
  houseChampionshipReview: string;
  departmentalHighlights: string;
  studentEngagementAssessment: string;
  actionableRecommendations: string[];
}

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type UserStatus = 'Active' | 'Disabled';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  student_id?: string;
  staff_id?: string;
  teacher_id?: string;
  department?: string;
  date_of_birth?: string;
  phone?: string;
  password_changed?: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  linkedStudent?: Student | null;
  linkedTeacher?: Teacher | null;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface NotificationPreferences {
  enabled: boolean;
  events: boolean;
  achievements: boolean;
  reminders: boolean;
}

export type NotificationType =
  | 'event_created'
  | 'participation_updated'
  | 'achievement_created'
  | 'achievement_updated'
  | 'event_reminder'
  | 'house_rank_update'
  | 'system_announcement'
  | 'assignment_created'
  | 'assignment_graded'
  | 'assignment_submitted'
  | 'calendar_event_created'
  | 'exam_scheduled'
  | 'holiday_notice';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetTab?: string;
  recipient_role?: UserRole | 'ALL';
  recipient_id?: string;
}

export interface Teacher {
  id: string;
  staff_id?: string;
  user_id?: string;
  name: string;
  email: string;
  department: DepartmentName;
  phone?: string;
  designation: string;
  date_of_birth?: string; // YYYY-MM-DD
  birth_year?: number;
  assigned_classes: string[];
  assigned_subjects: string[];
  can_publish_events: boolean;
  status: 'Active' | 'Disabled';
}

export interface AcademicClass {
  id: string;
  name: string;
  department: DepartmentName;
  year: AcademicYear;
  section: string;
  student_count?: number;
  class_advisor?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: DepartmentName;
  semester: string;
  year: AcademicYear;
  credits: number;
}

export interface StudentResult {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  teacher_id: string;
  teacher_name: string;
  // Internal Marks Breakdown
  ia1_mark?: number; // max 20
  ia2_mark?: number; // max 20
  assignment_mark?: number; // max 5
  attendance_mark?: number; // max 5
  internal_total?: number; // max 50
  // Semester Final Marks
  external_mark?: number; // max 50
  total_mark?: number; // max 100
  mark: number; // legacy compatibility (matches total_mark or internal_total)
  max_marks: number;
  credits?: number; // e.g. 3 or 4
  grade: string; // 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'RA'
  result_status?: 'PASS' | 'FAIL' | 'ABSENT' | 'NOT_PUBLISHED';
  is_published?: boolean;
  semester: string;
  academic_year: string;
  updated_at?: string;
}

export interface StudentAcademicSummary {
  student_id: string;
  student_name: string;
  department: string;
  year: string;
  section: string;
  semester: string;
  academic_year: string;
  results: StudentResult[];
  total_marks: number;
  max_total: number;
  percentage: number;
  cgpa: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject_name: string;
  subject_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  description: string;
  instructions: string;
  created_at: string;
  due_date: string;
  max_marks: number;
  attachment_name?: string;
  status: 'Active' | 'Closed';
  submission_count?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  subject_name?: string;
  student_id: string;
  student_name: string;
  class_name?: string;
  submitted_at: string;
  submission_text: string;
  file_name?: string;
  status: 'Submitted' | 'Graded';
  marks?: number;
  feedback?: string;
  graded_at?: string;
  graded_by?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Events' | 'Exam' | 'General' | 'House';
  target_audience: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'CSE' | 'IT' | 'AI&DS';
  author_name: string;
  author_role: string;
  pinned: boolean;
  created_at: string;
}

// ==========================================
// SMART CALENDAR & TIMETABLE TYPES
// ==========================================

export type CalendarEventCategory =
  | 'Class'
  | 'Assignment'
  | 'Exam'
  | 'Event'
  | 'Competition'
  | 'Announcement'
  | 'Holiday'
  | 'Deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  category: CalendarEventCategory;
  date: string; // YYYY-MM-DD
  start_time: string; // e.g. "09:00"
  end_time: string; // e.g. "10:30"
  description?: string;
  location?: string;
  department?: DepartmentName | 'ALL';
  year?: AcademicYear | 'ALL';
  section?: string | 'ALL';
  target_audience?: 'ALL' | 'STUDENTS' | 'TEACHERS' | DepartmentName | string;
  created_by?: string;
  organizer?: string;
  status?: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  related_id?: string; // event_id, assignment_id, exam_id
}

export type WeekdayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableEntry {
  id: string;
  day: WeekdayName;
  start_time: string; // e.g. "09:00"
  end_time: string; // e.g. "10:00"
  department: DepartmentName;
  year: AcademicYear;
  section: string; // "Section A" or "Section B"
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  teacher_id: string;
  teacher_name: string;
  room: string; // e.g. "204", "Turing Lab 1"
  semester?: string;
  academic_year?: string;
}

export interface ExamSchedule {
  id: string;
  name: string; // e.g. "Continuous Internal Assessment (CIA 1)"
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  department: DepartmentName;
  year: AcademicYear;
  section: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "10:00"
  end_time: string; // "13:00"
  room: string; // "Exam Hall 101"
  max_marks?: number;
}

export interface Holiday {
  id: string;
  name: string;
  type: 'College Holiday' | 'Government Holiday' | 'Special Holiday' | 'Semester Break';
  date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  description?: string;
}

