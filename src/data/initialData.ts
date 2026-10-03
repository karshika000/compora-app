import { Student, Achievement, CollegeEvent, EventParticipation } from '../types';
import { SEED_STUDENTS } from './seedStudents';
import { SEED_EVENTS, SEED_ACHIEVEMENTS, SEED_PARTICIPATION } from './seedEvents';

export const POINT_SYSTEM = {
  achievements: {
    College: 10,
    District: 20,
    State: 30,
    National: 40,
  },
  participation: 5,
};

export const INITIAL_STUDENTS: Student[] = [...SEED_STUDENTS];
export const INITIAL_EVENTS: CollegeEvent[] = [...SEED_EVENTS];
export const INITIAL_ACHIEVEMENTS: Achievement[] = [...SEED_ACHIEVEMENTS];
export const INITIAL_PARTICIPATION: EventParticipation[] = [...SEED_PARTICIPATION];
