import { Semester as GpaSemester } from "@/components/GpaDashboard";
import { Semester } from "@/utils/parseCourseData";

const ORDER = ["Fall", "Spring"] as const;
const LEVELS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;

// Parse a semester name to extract season and year
function parseSemesterName(name: string): [string, number] {
  // Default fallbacks
  let season = "Fall";
  let year = new Date().getFullYear();

  // Try to extract season and year from common formats
  if (name.includes("Fall") || name.includes("fall")) {
    season = "Fall";
  } else if (name.includes("Spring") || name.includes("spring")) {
    season = "Spring";
  }

  // Extract year (find 4 consecutive digits)
  const yearMatch = name.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }

  return [season, year];
}

export function generateFutureSemesters(existing: Semester[]): Semester[] {
  if (!existing.length) return [];

  // sort existing just in case (naive sort by ID as a backup)
  const semesters = [...existing].sort(
    (a, b) => parseInt(a.id) - parseInt(b.id)
  );

  const last = semesters[semesters.length - 1];
  const lastTermText = last.name;
  const match = lastTermText.match(/\b(20\d{2})\b/);
  
  // Determine starting season and year
  let season = "Spring";
  let year = match ? parseInt(match[0]) : new Date().getFullYear();
  
  // Important fix: If last term was Fall, advance to next year's Spring
  if (lastTermText.includes("Fall")) {
    season = "Spring";
    year = match ? parseInt(match[0]) + 1 : new Date().getFullYear() + 1;
  } else if (lastTermText.includes("Spring")) {
    season = "Fall";
    year = match ? parseInt(match[0]) : new Date().getFullYear();
  }
  
  // Determine starting year level
  let levelIndex = 0;
  // Simple heuristic to estimate current year level from last term name
  const levelMatch = lastTermText.match(/(Freshman|Sophomore|Junior|Senior)/i);
  if (levelMatch) {
    const foundLevel = levelMatch[1].toLowerCase();
    if (foundLevel.includes("fresh")) levelIndex = 0;
    else if (foundLevel.includes("soph")) levelIndex = 1;
    else if (foundLevel.includes("jun")) levelIndex = 2;
    else if (foundLevel.includes("sen")) levelIndex = 3;
  }
  
  let yearLevel = LEVELS[levelIndex];
  
  // Generate future semesters
  while (true) {
    // Create the next semester
    const next: Semester = {
      id: `${season}${year}`,
      name: `${season} ${year}`,
      courses: [],
      totalCredits: 0,
      totalGradePoints: 0,
      gpa: 0,
    };
    
    // Add it to the list
    semesters.push(next);
    
    // Stop once we've reached Senior Spring
    if (yearLevel === "Senior" && season === "Spring") break;
    
    // Advance term
    const nextIsSpring = season === "Fall";
    season = nextIsSpring ? "Spring" : "Fall";
    if (!nextIsSpring) year += 1; // Fall→Spring keeps year, Spring→Fall adds one
    
    // Promote class year after Spring term
    if (season === "Fall" && levelIndex < 3) levelIndex++;
    yearLevel = LEVELS[levelIndex];
  }

  return semesters;
}