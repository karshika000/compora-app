import { Student, Achievement, CollegeEvent, EventParticipation, HouseStats, DepartmentStats, YearStats, TopAchiever, HouseName, DepartmentName, AcademicYear } from '../types';
import { POINT_SYSTEM } from '../data/initialData';

export const HOUSES: HouseName[] = ['Red', 'Blue', 'Green', 'Yellow'];
export const DEPARTMENTS: DepartmentName[] = ['CSE', 'IT', 'CSBS', 'BME', 'Mechanical', 'ECE', 'EEE', 'Civil', 'AI&DS'];
export const ACADEMIC_YEARS: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export function calculateAchievementPoints(level: string): number {
  return POINT_SYSTEM.achievements[level as keyof typeof POINT_SYSTEM.achievements] || 10;
}

export function calculateHouseStats(
  students: Student[],
  achievements: Achievement[],
  participations: EventParticipation[]
): HouseStats[] {
  // Map student_id to house
  const studentHouseMap = new Map<string, HouseName>();
  students.forEach((s) => studentHouseMap.set(s.student_id, s.house));

  // Initialize stats for each house
  const statsMap: Record<HouseName, {
    studentCount: number;
    participationCount: number;
    achievementCount: number;
    achievementPoints: number;
    participationPoints: number;
    studentPoints: Map<string, number>;
  }> = {
    Red: { studentCount: 0, participationCount: 0, achievementCount: 0, achievementPoints: 0, participationPoints: 0, studentPoints: new Map() },
    Blue: { studentCount: 0, participationCount: 0, achievementCount: 0, achievementPoints: 0, participationPoints: 0, studentPoints: new Map() },
    Green: { studentCount: 0, participationCount: 0, achievementCount: 0, achievementPoints: 0, participationPoints: 0, studentPoints: new Map() },
    Yellow: { studentCount: 0, participationCount: 0, achievementCount: 0, achievementPoints: 0, participationPoints: 0, studentPoints: new Map() },
  };

  // Count students
  students.forEach((s) => {
    if (statsMap[s.house]) {
      statsMap[s.house].studentCount += 1;
      statsMap[s.house].studentPoints.set(s.student_id, 0);
    }
  });

  // Calculate achievements
  achievements.forEach((ach) => {
    const house = studentHouseMap.get(ach.student_id);
    if (house && statsMap[house]) {
      const pts = calculateAchievementPoints(ach.level);
      statsMap[house].achievementCount += 1;
      statsMap[house].achievementPoints += pts;
      const current = statsMap[house].studentPoints.get(ach.student_id) || 0;
      statsMap[house].studentPoints.set(ach.student_id, current + pts);
    }
  });

  // Calculate participations
  participations.forEach((part) => {
    const house = studentHouseMap.get(part.student_id);
    if (house && statsMap[house]) {
      statsMap[house].participationCount += 1;
      statsMap[house].participationPoints += POINT_SYSTEM.participation;
      const current = statsMap[house].studentPoints.get(part.student_id) || 0;
      statsMap[house].studentPoints.set(part.student_id, current + POINT_SYSTEM.participation);
    }
  });

  // Build sorted list
  const result: HouseStats[] = HOUSES.map((house) => {
    const s = statsMap[house];
    const totalPoints = s.achievementPoints + s.participationPoints;

    // Find top student in this house
    let topStudentId = '';
    let topPoints = -1;
    s.studentPoints.forEach((pts, sId) => {
      if (pts > topPoints) {
        topPoints = pts;
        topStudentId = sId;
      }
    });

    const topStudentObj = students.find((st) => st.student_id === topStudentId);

    return {
      house,
      studentCount: s.studentCount,
      participationCount: s.participationCount,
      achievementCount: s.achievementCount,
      achievementPoints: s.achievementPoints,
      participationPoints: s.participationPoints,
      totalPoints,
      rank: 0,
      topAchiever: topStudentObj && topPoints > 0 ? {
        student_id: topStudentObj.student_id,
        name: topStudentObj.name,
        points: topPoints,
      } : undefined,
    };
  });

  // Sort by Total Points descending, then achievementCount descending, then participationCount descending
  result.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.achievementCount !== a.achievementCount) {
      return b.achievementCount - a.achievementCount;
    }
    return b.participationCount - a.participationCount;
  });

  // Assign ranks
  result.forEach((item, index) => {
    item.rank = index + 1;
  });

  return result;
}

export function calculateEventHouseBreakdown(
  eventId: string,
  participations: EventParticipation[],
  students: Student[]
): Record<HouseName, number> {
  const studentHouseMap = new Map<string, HouseName>();
  students.forEach((s) => studentHouseMap.set(s.student_id, s.house));

  const breakdown: Record<HouseName, number> = {
    Red: 0,
    Blue: 0,
    Green: 0,
    Yellow: 0,
  };

  participations
    .filter((p) => p.event_id === eventId)
    .forEach((p) => {
      const house = studentHouseMap.get(p.student_id);
      if (house && breakdown[house] !== undefined) {
        breakdown[house] += 1;
      }
    });

  return breakdown;
}

export function calculateDepartmentStats(
  students: Student[],
  achievements: Achievement[],
  participations: EventParticipation[]
): DepartmentStats[] {
  const studentDeptMap = new Map<string, DepartmentName>();
  students.forEach((s) => studentDeptMap.set(s.student_id, s.department));

  const deptData: Record<DepartmentName, DepartmentStats> = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = {
      department: dept,
      studentCount: 0,
      participationCount: 0,
      achievementCount: 0,
      achievementPoints: 0,
    };
    return acc;
  }, {} as Record<DepartmentName, DepartmentStats>);

  students.forEach((s) => {
    if (deptData[s.department]) {
      deptData[s.department].studentCount += 1;
    }
  });

  participations.forEach((p) => {
    const dept = studentDeptMap.get(p.student_id);
    if (dept && deptData[dept]) {
      deptData[dept].participationCount += 1;
    }
  });

  achievements.forEach((ach) => {
    const dept = studentDeptMap.get(ach.student_id);
    if (dept && deptData[dept]) {
      const pts = calculateAchievementPoints(ach.level);
      deptData[dept].achievementCount += 1;
      deptData[dept].achievementPoints += pts;
    }
  });

  return Object.values(deptData);
}

export function calculateYearStats(
  students: Student[],
  achievements: Achievement[],
  participations: EventParticipation[]
): YearStats[] {
  const studentYearMap = new Map<string, AcademicYear>();
  students.forEach((s) => studentYearMap.set(s.student_id, s.year));

  const yearData: Record<AcademicYear, YearStats> = ACADEMIC_YEARS.reduce((acc, yr) => {
    acc[yr] = {
      year: yr,
      studentCount: 0,
      participationCount: 0,
      achievementCount: 0,
    };
    return acc;
  }, {} as Record<AcademicYear, YearStats>);

  students.forEach((s) => {
    if (yearData[s.year]) {
      yearData[s.year].studentCount += 1;
    }
  });

  participations.forEach((p) => {
    const yr = studentYearMap.get(p.student_id);
    if (yr && yearData[yr]) {
      yearData[yr].participationCount += 1;
    }
  });

  achievements.forEach((ach) => {
    const yr = studentYearMap.get(ach.student_id);
    if (yr && yearData[yr]) {
      yearData[yr].achievementCount += 1;
    }
  });

  return Object.values(yearData);
}

export function getTopAchievers(
  students: Student[],
  achievements: Achievement[],
  limit = 5
): TopAchiever[] {
  const studentAchMap = new Map<string, { count: number; points: number }>();

  achievements.forEach((ach) => {
    const pts = calculateAchievementPoints(ach.level);
    const existing = studentAchMap.get(ach.student_id) || { count: 0, points: 0 };
    studentAchMap.set(ach.student_id, {
      count: existing.count + 1,
      points: existing.points + pts,
    });
  });

  const list: TopAchiever[] = [];
  studentAchMap.forEach((data, sId) => {
    const student = students.find((s) => s.student_id === sId);
    if (student) {
      list.push({
        student_id: student.student_id,
        name: student.name,
        department: student.department,
        year: student.year,
        house: student.house,
        achievementCount: data.count,
        totalPoints: data.points,
      });
    }
  });

  list.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.achievementCount - a.achievementCount;
  });

  return list.slice(0, limit);
}
