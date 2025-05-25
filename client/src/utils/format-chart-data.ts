import { Semester } from "@/utils/parseCourseData";
import { SemesterSection } from "@/utils/organizeSemesters";
import { isInProgressGrade } from "@/utils/grade-utils";

/**
 * Maps academic year to a year level string
 */
const mapYearToLevel = (year: string): "Freshman" | "Sophomore" | "Junior" | "Senior" => {
  if (year.toLowerCase().includes("freshman")) return "Freshman";
  if (year.toLowerCase().includes("sophomore")) return "Sophomore";
  if (year.toLowerCase().includes("junior")) return "Junior";
  return "Senior";
};

/**
 * Converts a letter grade to a grade point value
 * Returns null if the grade cannot be converted (like P/F, W, I)
 */
const getGradeValue = (grade: string): number | null => {
  const gradeMap: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  
  // Clean up the input grade and convert to uppercase
  const cleanGrade = grade.trim().toUpperCase();
  
  return gradeMap[cleanGrade] ?? null;
};

/**
 * Extracts details from a semester name to create a sortable key
 */
function getSemesterSortKey(semesterName: string): number {
  const upperName = semesterName.toUpperCase();
  let year = 0;
  let termOrder = 5; // Default/unknown
  
  // Extract the year (matches the first 4-digit sequence)
  const yearMatch = upperName.match(/\d{4}/);
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10);
  }
  
  // Determine the term order
  if (upperName.includes("SPRING")) {
    termOrder = 1;
  } else if (upperName.includes("SUMMER")) {
    termOrder = 2;
  } else if (upperName.includes("FALL")) {
    termOrder = 3;
  } else if (upperName.includes("WINTER")) {
    termOrder = 4;
  }
  
  // Create a single numeric sort key (year * 10 + termOrder)
  // This ensures proper chronological ordering
  return (year * 10) + termOrder;
}

export interface GpaSemesterData {
  id: string;
  name: string;
  gpa: number;
  totalCredits: number;
  totalGradePoints: number;
  includeInOverallGPA: boolean;
  sectionName: string;
  sectionColor: string;
  runningCredits: number;
  runningGPA: number;
}

/**
 * Extract year and term information from a semester name
 */
function getSemesterDetails(name: string): { year: number; termOrder: number } {
  const match = name.match(/(Spring|Summer|Fall|Winter)\s+(\d{4})/i);
  if (!match) return { year: 0, termOrder: 0 };

  const [_, term, year] = match;
  const termOrder = {
    spring: 1,
    summer: 2,
    fall: 3,
    winter: 4
  }[term.toLowerCase()] || 0;

  return {
    year: parseInt(year, 10),
    termOrder
  };
}

/**
 * Get a consistent color for a section based on its name
 */
function getSectionColor(sectionName: string): string {
  const colors = {
    "Freshman": "#4CAF50", // Green
    "Sophomore": "#2196F3", // Blue
    "Junior": "#FF9800", // Orange
    "Senior": "#9C27B0", // Purple
    "Other": "#607D8B" // Blue Grey
  };
  return colors[sectionName as keyof typeof colors] || "#607D8B";
}

/**
 * Format semester data for the GPA chart
 * Only includes semesters where all courses have final grades
 */
export function formatSemestersForChart(
  semesters: Semester[],
  organizedSections: SemesterSection[]
): {
  id: string;
  term: string;
  yearLevel: "Freshman" | "Sophomore" | "Junior" | "Senior";
  gpa: number | null;
  credits?: number;
  gradePoints?: number;
  sortKey?: number;
}[] {
  // Create a map of semester IDs to their section metadata
  const semesterSectionMap = new Map(
    organizedSections.flatMap((section) =>
      section.semesters.map((semester) => [semester.id, section])
    )
  );

  // Sort semesters chronologically
  const sortedSemesters = [...semesters].sort((a, b) => {
    const aDetails = getSemesterDetails(a.name);
    const bDetails = getSemesterDetails(b.name);
    
    if (aDetails.year !== bDetails.year) {
      return aDetails.year - bDetails.year;
    }
    return aDetails.termOrder - bDetails.termOrder;
  });

  return sortedSemesters
    .filter(semester => semester.includeInOverallGPA) // Only include semesters where all courses have final grades
    .map((semester) => {
      const section = semesterSectionMap.get(semester.id);
      const yearLevel = mapYearToLevel(section?.year || "Other");

      return {
        id: semester.id,
        term: semester.name,
        yearLevel,
        gpa: semester.gpa,
        credits: semester.totalCredits,
        gradePoints: semester.totalGradePoints,
        sortKey: getSemesterSortKey(semester.name)
      };
    });
}