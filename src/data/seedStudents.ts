import { Student } from '../types';

export interface SeedStudentData extends Student {
  birthYear: number;
}

export const SEED_STUDENTS: SeedStudentData[] = [
  {
    id: 'std-1',
    student_id: '26CSE001',
    name: 'Yogakarshika',
    department: 'CSE',
    year: '3rd Year',
    section: 'Section A',
    house: 'Red',
    email: '26cse001@compora.edu',
    phone: '+91 98401 23456',
    date_of_birth: '2005-04-01',
    birth_year: 2005,
    birthYear: 2005,
  },
];
