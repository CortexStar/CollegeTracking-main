import { Semester } from "./parseCourseData";

/**
 * Interface for a section of semesters grouped by academic year category
 * with additional properties to help with proper chronological sorting
 */
export interface SemesterSection {
  year: string;               // Display name: "Freshman", "Summer 2024", etc.
  semesters: Semester[];      // List of semesters in this group
  sortYear?: number;          // The primary year used for sorting this group 
  sortTermOrder?: number;     // Order within a year: 1=Spring, 2=Summer, 3=Fall
}

/**
 * Mapping of term names to their relative order within a calendar year
 */
const TERM_ORDER = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
  UNKNOWN: 5
};

/**
 * Academic year categories (Freshman, Sophomore, etc.)
 */
const ACADEMIC_LABELS = [
  "Freshman", 
  "Sophomore", 
  "Junior", 
  "Senior",
  "Graduate I",
  "Graduate II"
];

/**
 * Parse a semester name to extract the year and term
 * @param semesterName The name of the semester (e.g., "Spring 2024")
 * @returns Object with year, term, and termOrder properties
 */
function getSemesterDetails(semesterName: string): { year: number; term: string; termOrder: number } {
  const upperName = semesterName.toUpperCase();
  let year = 0;
  let term = "UNKNOWN";
  let order = TERM_ORDER.UNKNOWN;

  // Extract the year (matches the first 4-digit sequence)
  const yearMatch = upperName.match(/\d{4}/);
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10);
  }

  // Determine the term
  if (upperName.includes("SPRING")) {
    term = "SPRING";
    order = TERM_ORDER.SPRING;
  } else if (upperName.includes("SUMMER")) {
    term = "SUMMER";
    order = TERM_ORDER.SUMMER;
  } else if (upperName.includes("FALL")) {
    term = "FALL";
    order = TERM_ORDER.FALL;
  } else if (upperName.includes("WINTER")) {
    term = "WINTER";
    order = TERM_ORDER.WINTER;
  }
  
  return { year, term, termOrder: order };
}

/**
 * Organize a flat list of semesters into chronological sections:
 * - Fall/Spring semesters are grouped together into academic years (Freshman, Sophomore, etc.)
 * - Summer semesters each get their own "Summer {year}" section that appears chronologically
 *   between the Spring and Fall semester groups of the same calendar year
 */
export function organizeSemesters(semesters: Semester[]): SemesterSection[] {
  if (!semesters || semesters.length === 0) {
    return [];
  }

  // Enrich semesters with parsed details and sort chronologically
  const detailedSemesters = semesters.map(sem => ({
    ...sem,
    details: getSemesterDetails(sem.name),
  })).sort((a, b) => {
    // Sort chronologically by year then term order
    if (a.details.year !== b.details.year) {
      return a.details.year - b.details.year;
    }
    return a.details.termOrder - b.details.termOrder;
  });

  // Prepare the result array and tracking structures
  const sections: SemesterSection[] = [];
  const academicYearMap: Record<number, SemesterSection> = {};
  let firstAcademicYear = -1;

  // Determine the first academic year's starting year
  if (detailedSemesters.length > 0) {
    const firstSemDetails = detailedSemesters[0].details;
    if (firstSemDetails.term === "FALL") {
      firstAcademicYear = firstSemDetails.year;
    } else { // Spring or Summer
      firstAcademicYear = firstSemDetails.year - 1; // Academic year started in the previous year
    }
  }

  // Process each semester for grouping
  detailedSemesters.forEach(sem => {
    const { year, term, termOrder } = sem.details;

    if (term === "SUMMER") {
      // Summer semesters form their own separate group
      sections.push({
        year: `Summer ${year}`,
        semesters: [sem],
        sortYear: year,
        sortTermOrder: TERM_ORDER.SUMMER
      });
    } 
    else if (term === "FALL" || term === "SPRING") {
      // Calculate which academic year this semester belongs to
      let academicYearStartYear = year;
      if (term === "SPRING") {
        academicYearStartYear = year - 1;  // Spring 2024 is part of 2023-2024 academic year
      }

      // Find or create the academic year group
      let academicGroup = academicYearMap[academicYearStartYear];
      if (!academicGroup) {
        // Calculate which academic label to use (Freshman, Sophomore, etc.)
        const academicIndex = academicYearStartYear - firstAcademicYear;
        const yearLabel = academicIndex < ACADEMIC_LABELS.length
          ? ACADEMIC_LABELS[academicIndex]
          : `Year ${academicIndex + 1}`;

        // Create new academic year group
        academicGroup = {
          year: yearLabel,
          semesters: [],
          sortYear: academicYearStartYear,
          sortTermOrder: term === "FALL" ? TERM_ORDER.FALL : TERM_ORDER.SPRING
        };
        academicYearMap[academicYearStartYear] = academicGroup;
        sections.push(academicGroup);
      }
      
      // Add the semester to its group
      academicGroup.semesters.push(sem);
    }
    else {
      // Handle winter or unrecognized terms by creating "Miscellaneous" group
      const miscGroup = sections.find(s => s.year === "Miscellaneous");
      if (miscGroup) {
        miscGroup.semesters.push(sem);
      } else {
        sections.push({
          year: "Miscellaneous",
          semesters: [sem],
          sortYear: 9999,  // Always sort at the end
          sortTermOrder: TERM_ORDER.UNKNOWN
        });
      }
    }
  });

  // Sort semesters within each academic year group and refine the sortTermOrder
  sections.forEach(group => {
    if (group.year.startsWith("Summer ")) {
      // Already set up correctly
    } 
    else if (group.year !== "Miscellaneous") {
      // For academic year groups (Freshman, Sophomore, etc.)
      // Sort the semesters within the group
      group.semesters.sort((a, b) => {
        const detailsA = getSemesterDetails(a.name);
        const detailsB = getSemesterDetails(b.name);
        return (detailsA.year * 10 + detailsA.termOrder) - (detailsB.year * 10 + detailsB.termOrder);
      });

      // Determine effective sort order based on the last semester in the group
      if (group.semesters.length > 0) {
        const lastSem = group.semesters[group.semesters.length - 1];
        const lastSemDetails = getSemesterDetails(lastSem.name);
        
        // If this group ends with Spring of a year, it should sort before Summer of that year
        if (lastSemDetails.term === "SPRING") {
          group.sortYear = lastSemDetails.year;  // Use the Spring's year
          group.sortTermOrder = TERM_ORDER.SPRING;
        }
      }
    }
  });

  // Final sort of all groups in proper chronological order
  return sections.sort((a, b) => {
    // If years differ, sort by year
    if (a.sortYear !== b.sortYear) {
      return (a.sortYear || 0) - (b.sortYear || 0);
    }
    
    // If years are the same, sort by term order
    // (Spring before Summer before Fall)
    return (a.sortTermOrder || 999) - (b.sortTermOrder || 999);
  });
}