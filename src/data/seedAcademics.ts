import { AcademicClass, Subject, StudentResult } from '../types';

export const SEED_ACADEMIC_CLASSES: AcademicClass[] = [
  // CSE Classes
  { id: 'cls-1', name: '4th Year CSE A', department: 'CSE', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-2', name: '4th Year CSE B', department: 'CSE', year: '4th Year', section: 'Section B', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-3', name: '3rd Year CSE A', department: 'CSE', year: '3rd Year', section: 'Section A', student_count: 1, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-4', name: '3rd Year CSE B', department: 'CSE', year: '3rd Year', section: 'Section B', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-5', name: '2nd Year CSE A', department: 'CSE', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-6', name: '2nd Year CSE B', department: 'CSE', year: '2nd Year', section: 'Section B', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-7', name: '1st Year CSE A', department: 'CSE', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-8', name: '1st Year CSE B', department: 'CSE', year: '1st Year', section: 'Section B', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // IT Classes
  { id: 'cls-9', name: '4th Year IT A', department: 'IT', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-10', name: '3rd Year IT A', department: 'IT', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-11', name: '2nd Year IT A', department: 'IT', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-12', name: '1st Year IT A', department: 'IT', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // AI&DS Classes
  { id: 'cls-13', name: '4th Year AI&DS A', department: 'AI&DS', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-14', name: '3rd Year AI&DS A', department: 'AI&DS', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-15', name: '2nd Year AI&DS A', department: 'AI&DS', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-16', name: '1st Year AI&DS A', department: 'AI&DS', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // CSBS Classes
  { id: 'cls-17', name: '4th Year CSBS A', department: 'CSBS', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-18', name: '3rd Year CSBS A', department: 'CSBS', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-19', name: '2nd Year CSBS A', department: 'CSBS', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-20', name: '1st Year CSBS A', department: 'CSBS', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // ECE Classes
  { id: 'cls-21', name: '4th Year ECE A', department: 'ECE', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-22', name: '3rd Year ECE A', department: 'ECE', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-23', name: '2nd Year ECE A', department: 'ECE', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-24', name: '1st Year ECE A', department: 'ECE', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // EEE Classes
  { id: 'cls-25', name: '4th Year EEE A', department: 'EEE', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-26', name: '3rd Year EEE A', department: 'EEE', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-27', name: '2nd Year EEE A', department: 'EEE', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-28', name: '1st Year EEE A', department: 'EEE', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // Mechanical Classes
  { id: 'cls-29', name: '4th Year Mechanical A', department: 'Mechanical', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-30', name: '3rd Year Mechanical A', department: 'Mechanical', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-31', name: '2nd Year Mechanical A', department: 'Mechanical', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-32', name: '1st Year Mechanical A', department: 'Mechanical', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // Civil Classes
  { id: 'cls-33', name: '4th Year Civil A', department: 'Civil', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-34', name: '3rd Year Civil A', department: 'Civil', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-35', name: '2nd Year Civil A', department: 'Civil', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-36', name: '1st Year Civil A', department: 'Civil', year: '1st Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },

  // BME Classes
  { id: 'cls-37', name: '4th Year BME A', department: 'BME', year: '4th Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-38', name: '3rd Year BME A', department: 'BME', year: '3rd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
  { id: 'cls-39', name: '2nd Year BME A', department: 'BME', year: '2nd Year', section: 'Section A', student_count: 0, class_advisor: 'Dr. Arun Kumar' },
];

export const SEED_SUBJECTS: Subject[] = [
  // CSE & Common Core (10 Subjects)
  { id: 'sub-1', code: 'CS101', name: 'Programming in C', department: 'CSE', semester: 'Semester 1', year: '1st Year', credits: 4 },
  { id: 'sub-2', code: 'CS102', name: 'Discrete Mathematics', department: 'CSE', semester: 'Semester 1', year: '1st Year', credits: 4 },
  { id: 'sub-3', code: 'CS201', name: 'Data Structures & Algorithms', department: 'CSE', semester: 'Semester 3', year: '2nd Year', credits: 4 },
  { id: 'sub-4', code: 'CS202', name: 'Computer Architecture', department: 'CSE', semester: 'Semester 3', year: '2nd Year', credits: 3 },
  { id: 'sub-5', code: 'CS301', name: 'Database Management Systems', department: 'CSE', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-6', code: 'CS302', name: 'Operating Systems', department: 'CSE', semester: 'Semester 5', year: '3rd Year', credits: 3 },
  { id: 'sub-7', code: 'CS303', name: 'Computer Networks', department: 'CSE', semester: 'Semester 6', year: '3rd Year', credits: 4 },
  { id: 'sub-8', code: 'CS401', name: 'Cloud Computing & DevOps', department: 'CSE', semester: 'Semester 7', year: '4th Year', credits: 3 },
  { id: 'sub-9', code: 'CS402', name: 'Software Engineering & Agile', department: 'CSE', semester: 'Semester 7', year: '4th Year', credits: 3 },
  { id: 'sub-10', code: 'CS403', name: 'Information & Cyber Security', department: 'CSE', semester: 'Semester 8', year: '4th Year', credits: 3 },

  // AI&DS Subjects (5 Subjects)
  { id: 'sub-11', code: 'AD201', name: 'Probability & Statistics for AI', department: 'AI&DS', semester: 'Semester 3', year: '2nd Year', credits: 4 },
  { id: 'sub-12', code: 'AD301', name: 'Machine Learning', department: 'AI&DS', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-13', code: 'AD302', name: 'Artificial Intelligence', department: 'AI&DS', semester: 'Semester 6', year: '3rd Year', credits: 4 },
  { id: 'sub-14', code: 'AD401', name: 'Deep Learning & Neural Networks', department: 'AI&DS', semester: 'Semester 7', year: '4th Year', credits: 4 },
  { id: 'sub-15', code: 'AD402', name: 'Natural Language Processing', department: 'AI&DS', semester: 'Semester 8', year: '4th Year', credits: 3 },

  // IT Subjects (4 Subjects)
  { id: 'sub-16', code: 'IT201', name: 'Object Oriented Programming with Java', department: 'IT', semester: 'Semester 3', year: '2nd Year', credits: 4 },
  { id: 'sub-17', code: 'IT301', name: 'Web Technologies & Full Stack', department: 'IT', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-18', code: 'IT302', name: 'Mobile Application Development', department: 'IT', semester: 'Semester 6', year: '3rd Year', credits: 3 },
  { id: 'sub-19', code: 'IT401', name: 'Big Data Analytics', department: 'IT', semester: 'Semester 7', year: '4th Year', credits: 4 },

  // ECE Subjects (4 Subjects)
  { id: 'sub-20', code: 'EC201', name: 'Digital Logic & Circuit Design', department: 'ECE', semester: 'Semester 3', year: '2nd Year', credits: 4 },
  { id: 'sub-21', code: 'EC301', name: 'Digital Signal Processing', department: 'ECE', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-22', code: 'EC302', name: 'Microprocessors & Microcontrollers', department: 'ECE', semester: 'Semester 6', year: '3rd Year', credits: 4 },
  { id: 'sub-23', code: 'EC401', name: 'VLSI Design & Embedded Systems', department: 'ECE', semester: 'Semester 7', year: '4th Year', credits: 4 },

  // EEE Subjects (3 Subjects)
  { id: 'sub-24', code: 'EE201', name: 'Electrical Machines & Analysis', department: 'EEE', semester: 'Semester 3', year: '2nd Year', credits: 4 },
  { id: 'sub-25', code: 'EE301', name: 'Power Systems Engineering', department: 'EEE', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-26', code: 'EE302', name: 'Control Systems Engineering', department: 'EEE', semester: 'Semester 6', year: '3rd Year', credits: 4 },

  // Mechanical Subjects (3 Subjects)
  { id: 'sub-27', code: 'ME201', name: 'Engineering Thermodynamics', department: 'Mechanical', semester: 'Semester 3', year: '2nd Year', credits: 4 },
  { id: 'sub-28', code: 'ME301', name: 'Fluid Mechanics & Machinery', department: 'Mechanical', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-29', code: 'ME401', name: 'Robotics & Industrial Automation', department: 'Mechanical', semester: 'Semester 7', year: '4th Year', credits: 4 },

  // Civil Subjects (2 Subjects)
  { id: 'sub-30', code: 'CE301', name: 'Structural Analysis & Design', department: 'Civil', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-31', code: 'CE401', name: 'Environmental Engineering', department: 'Civil', semester: 'Semester 7', year: '4th Year', credits: 3 },

  // BME & CSBS Subjects (3 Subjects)
  { id: 'sub-32', code: 'BM301', name: 'Biomedical Instrumentation', department: 'BME', semester: 'Semester 5', year: '3rd Year', credits: 4 },
  { id: 'sub-33', code: 'BM401', name: 'Medical Image Processing', department: 'BME', semester: 'Semester 7', year: '4th Year', credits: 4 },
  { id: 'sub-34', code: 'CB301', name: 'Business Strategy & Financial Accounting', department: 'CSBS', semester: 'Semester 5', year: '3rd Year', credits: 3 },
];

export const SEED_RESULTS: StudentResult[] = [];
