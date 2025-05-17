import { Course } from "./parseCourseData";

/**
 * Grade point values based on letter grades
 */
export const gradePointMap: Record<string, number> = {
  "A+": 4.0,
  "A": 4.0,
  "A-": 3.67,
  "B+": 3.33,
  "B": 3.0,
  "B-": 2.67,
  "C+": 2.33,
  "C": 2.0,
  "C-": 1.67,
  "D+": 1.33,
  "D": 1.0,
  "D-": 0.67,
  "F": 0.0,
};

/**
 * Calculate grade points for a given credit value and letter grade
 * @param credits Number of credits for the course
 * @param grade Letter grade received (A, B+, etc.)
 * @returns The calculated grade points
 */
export function calculateGradePoints(credits: number, grade: string): number {
  const gradeValue = gradePointMap[grade.toUpperCase()] ?? 0;
  return credits * gradeValue;
}

/**
 * Calculate semester totals for a list of courses
 * @param courses List of course objects
 * @returns Object containing totalCredits, totalGradePoints, and calculated GPA
 */
export function calculateSemesterTotals(courses: Course[]) {
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalGradePoints = courses.reduce(
    (sum, course) => sum + course.gradePoints,
    0
  );

  const gpa =
    totalCredits > 0
      ? Math.round((totalGradePoints / totalCredits) * 100) / 100
      : 0;

  return {
    totalCredits,
    totalGradePoints,
    gpa,
  };
}