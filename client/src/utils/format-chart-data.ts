import { Semester as GpaSemester } from "@/components/GpaDashboard";
import { Semester } from "@/utils/parseCourseData";
import { SemesterSection } from "@/utils/organizeSemesters";

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

/**
 * Converts the application's semester data to the format expected by the GPA dashboard
 * Ensures chronological ordering of semesters in the visualization
 */
export function formatSemestersForChart(
  semesters: Semester[],
  organizedSections: SemesterSection[]
): GpaSemester[] {
  // Create a map to associate each semester with its section metadata
  const semesterSectionMap = new Map<string, SemesterSection>();
  
  // Create a flat array of all semesters in their proper chronological order
  let allSemestersInOrder: Semester[] = [];
  
  // First, populate the section map and create an ordered list of semesters
  organizedSections.forEach(section => {
    section.semesters.forEach(semester => {
      semesterSectionMap.set(semester.id, section);
    });
    
    // Add all semesters from this section in their current order
    allSemestersInOrder = [...allSemestersInOrder, ...section.semesters];
  });
  
  // Prepare GPA semester data, maintaining the same chronological order
  // as established by the organized sections
  return allSemestersInOrder.map(semester => {
    // Calculate total credits and grade points for this semester
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    if (semester.courses) {
      semester.courses.forEach(course => {
        const credits = course.credits ? parseFloat(course.credits.toString()) : 0;
        
        if (credits > 0 && course.grade && typeof course.grade === 'string') {
          totalCredits += credits;
          
          // Convert letter grade to grade points
          const gradeValue = getGradeValue(course.grade);
          if (gradeValue !== null) {
            totalGradePoints += credits * gradeValue;
          }
        }
      });
    }
    
    const section = semesterSectionMap.get(semester.id);
    
    return {
      id: semester.id,
      term: semester.name,
      yearLevel: mapYearToLevel(section?.year || "Freshman"),
      gpa: semester.gpa,
      credits: totalCredits > 0 ? totalCredits : undefined,
      gradePoints: totalGradePoints > 0 ? totalGradePoints : undefined,
      // Add additional metadata to help with sorting/ordering
      sortKey: getSemesterSortKey(semester.name)
    };
  });
}