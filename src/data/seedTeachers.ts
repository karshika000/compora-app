import { Teacher } from '../types';

export interface SeedTeacherData extends Teacher {
  staffId: string;
  staff_id: string;
  birthYear: number;
  birth_year: number;
  date_of_birth: string;
}

export const SEED_TEACHERS: SeedTeacherData[] = [
  // 1. Dr. Arun Kumar (DOB: 1985-07-15 -> Password: arun@1985)
  {
    id: 'teach-1',
    user_id: 'usr-stf001',
    staffId: 'STF001',
    staff_id: 'STF001',
    name: 'Dr. Arun Kumar',
    email: 'arun.kumar@compora.edu',
    department: 'CSE',
    phone: '+91 98401 22334',
    designation: 'Associate Professor & HOD',
    date_of_birth: '1985-07-15',
    birthYear: 1985,
    birth_year: 1985,
    assigned_classes: ['3rd Year CSE A', '1st Year CSE A'],
    assigned_subjects: ['Data Structures & Algorithms', 'Database Management Systems'],
    can_publish_events: true,
    status: 'Active',
  },
  // 2. Dr. Meenakshi Sundaram (DOB: 1982-03-22 -> Password: meen@1982)
  {
    id: 'teach-2',
    user_id: 'usr-stf002',
    staffId: 'STF002',
    staff_id: 'STF002',
    name: 'Dr. Meenakshi Sundaram',
    email: 'meenakshi.s@compora.edu',
    department: 'IT',
    phone: '+91 98402 33445',
    designation: 'Professor',
    date_of_birth: '1982-03-22',
    birthYear: 1982,
    birth_year: 1982,
    assigned_classes: ['2nd Year IT B', '4th Year IT A'],
    assigned_subjects: ['Web Technologies & Full Stack', 'Object Oriented Programming with Java'],
    can_publish_events: true,
    status: 'Active',
  },
  // 3. Prof. Rajesh Verma (DOB: 1980-05-18 -> Password: raje@1980)
  {
    id: 'teach-3',
    user_id: 'usr-stf003',
    staffId: 'STF003',
    staff_id: 'STF003',
    name: 'Prof. Rajesh Verma',
    email: 'rajesh.verma@compora.edu',
    department: 'AI&DS',
    phone: '+91 98403 44556',
    designation: 'Assistant Professor',
    date_of_birth: '1980-05-18',
    birthYear: 1980,
    birth_year: 1980,
    assigned_classes: ['3rd Year AI&DS A'],
    assigned_subjects: ['Machine Learning', 'Artificial Intelligence'],
    can_publish_events: true,
    status: 'Active',
  },
  // 4. Dr. Kavitha Balaji (DOB: 1988-09-12 -> Password: kavi@1988)
  {
    id: 'teach-4',
    user_id: 'usr-stf004',
    staffId: 'STF004',
    staff_id: 'STF004',
    name: 'Dr. Kavitha Balaji',
    email: 'kavitha.b@compora.edu',
    department: 'ECE',
    phone: '+91 98404 55667',
    designation: 'Associate Professor',
    date_of_birth: '1988-09-12',
    birthYear: 1988,
    birth_year: 1988,
    assigned_classes: ['1st Year ECE C'],
    assigned_subjects: ['Digital Logic & Circuit Design', 'Digital Signal Processing'],
    can_publish_events: true,
    status: 'Active',
  },
];
