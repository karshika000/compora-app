import { Teacher } from '../types';

export interface SeedTeacherData extends Teacher {
  staffId: string;
  staff_id: string;
  birthYear: number;
  birth_year: number;
  date_of_birth: string;
}

export const SEED_TEACHERS: SeedTeacherData[] = [
  {
    id: 'teach-1',
    user_id: 'usr-stf001',
    staffId: 'STF001',
    staff_id: 'STF001',
    name: 'Arun Kumar',
    email: 'arun.kumar@compora.edu',
    department: 'CSE',
    phone: '+91 98401 22334',
    designation: 'Associate Professor',
    date_of_birth: '1985-07-15',
    birthYear: 1985,
    birth_year: 1985,
    assigned_classes: ['3rd Year CSE A', '1st Year CSE A'],
    assigned_subjects: ['Data Structures & Algorithms', 'Database Systems'],
    can_publish_events: true,
    status: 'Active',
  },
];
