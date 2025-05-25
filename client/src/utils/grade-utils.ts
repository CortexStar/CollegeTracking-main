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
 * Returns true when a grade should be treated as "in-progress /
 * do-not-count-yet".  Tailor this list if your app supports other codes.
 */
export function isInProgressGrade(grade: string): boolean {
  const g = grade?.trim().toUpperCase();
  return g === ""         // blank
      || g === "IP"       // in progress
      || g === "TBD"      // to be determined
      || g === "NG"       // no grade yet
      || g === "PENDING"; // any custom token you use
}

/**
 * A semester may be included in cumulative calculations ONLY when
 * **every** course inside it has a *final* (non-in-progress) grade.
 *
 * • Returns false if the semester is empty.  
 * • Returns false the moment it finds a single in-progress grade.
 */
export function shouldIncludeSemesterInGPA(courses: Course[]): boolean {
  if (!courses?.length) return false;          // no classes ⇒ exclude
  return courses.every(c => !isInProgressGrade(c.grade));
}

/**
 * Calculate grade points for a given credit value and letter grade
 * @param credits Number of credits for the course
 * @param grade Letter grade received (A, B+, etc.)
 * @returns The calculated grade points
 */
export function calculateGradePoints(credits: number, grade: string): number {
  if (isInProgressGrade(grade)) return 0;
  const gradeValue = gradePointMap[grade.toUpperCase()] ?? 0;
  return credits * gradeValue;
}

// Add this interface
export interface SemesterTotals {
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  includeInOverallGPA: boolean;
}

/**
 * Calculate semester totals for a list of courses
 * @param courses List of course objects
 * @returns Object containing totalCredits, totalGradePoints, calculated GPA, and includeInOverallGPA flag
 */
export function calculateSemesterTotals(courses: Course[]): SemesterTotals {
  const includeInGPA = shouldIncludeSemesterInGPA(courses);
  
  let totalCredits = 0;
  let totalGradePoints = 0;

  // Only include completed courses in the totals
  courses.forEach((course) => {
    if (!isInProgressGrade(course.grade)) {
      totalCredits += course.credits;
      totalGradePoints += course.gradePoints;
    }
  });

  const gpa = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;

  return {
    totalCredits,
    totalGradePoints,
    gpa,
    includeInOverallGPA: includeInGPA
  };
}