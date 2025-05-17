import { calculateGradePoints } from "./grade-utils";

/**
 * Course object representing a single course within a semester
 */
export interface Course {
  _uid?: string; // unique identifier for each course object
  id: string; // the course code/ID (e.g., "MATH101")
  classNumber?: string; // Optional: e.g., "11919" from "ECO2023 (11919)"
  title: string; // the course title (e.g., "Introduction to Calculus")
  grade: string; // the letter grade (e.g., "A", "B+", etc.)
  credits: number; // number of credits (e.g., 3, 4, etc.)
  gradePoints: number; // calculated grade points (credits * grade value)
}

/**
 * Semester object representing a collection of courses
 */
export interface Semester {
  id: string; // unique identifier
  name: string; // display name (e.g., "Fall 2023")
  courses: Course[]; // list of courses in this semester
  totalCredits: number; // sum of all course credits
  totalGradePoints: number; // sum of all course grade points
  gpa: number; // calculated GPA for the semester
}

/**
 * Parse raw text input into Course objects (Simple Format)
 * Expected format: Course ID, Title, Grade, Credits (one per line, blank line separates courses)
 * 
 * @param rawText The raw text input to parse
 * @returns Array of Course objects
 */
export function parseCourseData(rawText: string): Course[] {
  // First try the enhanced transcript parser
  const parsedTranscript = parseTranscriptText(rawText);
  if (parsedTranscript.length > 0) {
    return parsedTranscript;
  }
  
  // If the enhanced parser didn't find anything, use the simple parser
  return parseSimpleFormat(rawText);
}

/**
 * Simple format parser (original implementation)
 * Expects: Course ID, Title, Grade, Credits (one per line, blank line separates courses)
 */
function parseSimpleFormat(rawText: string): Course[] {
  const lines = rawText.split("\n").map((line) => line.trim());
  const courses: Course[] = [];
  
  // Temporary holding variables
  let currentCourse: Partial<Course> = {};
  let lineCounter = 0;
  
  for (const line of lines) {
    // Skip empty lines that are not between courses
    if (!line && lineCounter === 0) continue;
    
    // If we encounter an empty line and we have a course in progress, it's a separator
    if (!line && Object.keys(currentCourse).length > 0) {
      if (isValidCourse(currentCourse)) {
        // All required fields are present, add the course
        const course = currentCourse as Course;
        
        // Calculate grade points
        course.gradePoints = calculateGradePoints(course.credits, course.grade);
        
        // Add a unique identifier
        course._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        courses.push(course);
      }
      
      // Reset for the next course
      currentCourse = {};
      lineCounter = 0;
      continue;
    }
    
    // Process the line based on its position
    if (lineCounter === 0) {
      // First line is course ID
      currentCourse.id = line;
    } else if (lineCounter === 1) {
      // Second line is course title
      currentCourse.title = line;
    } else if (lineCounter === 2) {
      // Third line is grade
      currentCourse.grade = line.toUpperCase();
    } else if (lineCounter === 3) {
      // Fourth line is credits
      const credits = parseFloat(line);
      if (!isNaN(credits)) {
        currentCourse.credits = credits;
      } else {
        // Invalid credits, skip this course
        currentCourse = {};
        lineCounter = 0;
        continue;
      }
      
      // We have all 4 fields, add the course
      if (isValidCourse(currentCourse)) {
        const course = currentCourse as Course;
        
        // Calculate grade points
        course.gradePoints = calculateGradePoints(course.credits, course.grade);
        
        // Add a unique identifier
        course._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        courses.push(course);
      }
      
      // Reset for the next course
      currentCourse = {};
      lineCounter = 0;
      continue;
    }
    
    lineCounter++;
  }
  
  // Don't forget the last course if there's no trailing empty line
  if (Object.keys(currentCourse).length > 0 && isValidCourse(currentCourse)) {
    const course = currentCourse as Course;
    
    // Calculate grade points
    course.gradePoints = calculateGradePoints(course.credits, course.grade);
    
    // Add a unique identifier
    course._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    courses.push(course);
  }
  
  return courses;
}

/**
 * A more sophisticated, advanced parsing system for academic transcript data.
 * 
 * This parser can intelligently extract course information from complex transcript formats,
 * identifying course codes, titles, grades, and credits from various layouts.
 * 
 * @param rawText The raw transcript text to parse
 * @returns Array of Course objects
 */
export function parseTranscriptText(rawText: string): Course[] {
  const courses: Course[] = [];
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0); // Remove empty lines and trim

  if (lines.length === 0) {
    return [];
  }

  // --- Regex Patterns ---
  const courseCodePattern = /^([A-Z]{2,4}\d{3,4}L?)\s*\(?(\d*)\)?$/; // Captures: 1=CourseID, 2=ClassNumber
  const gradePattern = /^[A-F][+-]?$/i; // Case-insensitive grade (A, B+, c-, etc.)
  const creditsPattern = /^\d+(\.\d{2})?$/; // Matches X or X.XX (e.g., 3, 4.00)

  // --- State and Markers ---
  let inCourseSection = false;
  const courseSectionStartKeywords = ["Course (Class)", "Course Title"];
  const courseDataHeaderKeywords = ["Grade", "Credit Attempted", "Credit Earned", "Credit for GPA"];
  // Renamed to be more descriptive - these can appear within a list of courses
  const interstitialOrEndKeywords = ["Requirement", "Term GPA", "Overall GPA", "UNIVERSITY GPA"];

  let lineIndex = 0;

  // Phase 1: Find the start of the actual course listings
  while (lineIndex < lines.length && !inCourseSection) {
    const currentLine = lines[lineIndex];
    if (courseSectionStartKeywords.some(keyword => currentLine.toUpperCase().includes(keyword.toUpperCase()))) {
      const currentLineHasHeaders = courseDataHeaderKeywords.every(kw => currentLine.toUpperCase().includes(kw.toUpperCase()));
      const nextLine = lineIndex + 1 < lines.length ? lines[lineIndex + 1] : "";
      const nextLineHasHeaders = courseDataHeaderKeywords.every(kw => nextLine.toUpperCase().includes(kw.toUpperCase()));

      if (currentLineHasHeaders) {
        inCourseSection = true;
        lineIndex++; // Courses start after this header line
        break;
      } else if (nextLineHasHeaders) {
        inCourseSection = true;
        lineIndex += 2; // Courses start after the next line (which is the header)
        break;
      } else if (currentLine.toUpperCase().includes("COURSE (CLASS)")) { // If it's just the main trigger
         // Check if the *next* line seems like a header row or if we should look for course codes directly
         if (nextLineHasHeaders) {
            inCourseSection = true;
            lineIndex += 2;
            break;
         } else {
            // Assume courses might start soon, but headers are not immediately clear
            // Try to find the first course code
            for (let i = lineIndex + 1; i < lines.length; i++) {
                if (courseCodePattern.test(lines[i])) {
                    lineIndex = i;
                    inCourseSection = true;
                    break;
                }
                if (interstitialOrEndKeywords.some((keyword: string) => lines[i].toUpperCase().includes(keyword.toUpperCase()))) break; // Don't search too far
            }
            if(inCourseSection) break;
         }
      }
    }
    lineIndex++;
  }

  if (!inCourseSection) { // Fallback: if headers are missing or unusual, try to find first course code directly
    lineIndex = 0;
    while(lineIndex < lines.length) {
        if (courseCodePattern.test(lines[lineIndex])) {
            inCourseSection = true;
            break;
        }
        lineIndex++;
    }
    if (!inCourseSection) return []; // No courses found
  }

  // Phase 2: Extract courses
  let currentCourse: Partial<Course> = {};
  let collectedDataForCourse: string[] = []; // To temporarily store lines like grade, credits, etc.

  for (; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    if (interstitialOrEndKeywords.some((keyword: string) => line.toUpperCase().includes(keyword.toUpperCase()))) {
      // This line is a keyword. Finalize the course processed so far (if any).
      if (isValidCourse(currentCourse)) {
        currentCourse.gradePoints = calculateGradePoints(currentCourse.credits!, currentCourse.grade!);
        currentCourse._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        courses.push(currentCourse as Course);
      }
      // Reset for any potential new course or data block that might follow.
      currentCourse = {};
      collectedDataForCourse = [];
      continue; // Skip this keyword line and process the next line
    }

    const courseCodeMatch = line.match(courseCodePattern);
    if (courseCodeMatch) {
      // Finalize previous course
      if (isValidCourse(currentCourse)) {
        currentCourse.gradePoints = calculateGradePoints(currentCourse.credits!, currentCourse.grade!);
        currentCourse._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        courses.push(currentCourse as Course);
      }
      // Start a new course
      currentCourse = {
        id: courseCodeMatch[1],
        classNumber: courseCodeMatch[2] || undefined,
      };
      collectedDataForCourse = []; // Reset buffer for the new course's details
      continue;
    }

    if (currentCourse.id && !currentCourse.title) {
      currentCourse.title = line;
      continue;
    }

    if (currentCourse.id && currentCourse.title) {
      // We have a course ID and Title, subsequent lines are Grade, Credits, etc.
      // These are expected in order: Grade, then Credit Attempted (which we use as credits)
      collectedDataForCourse.push(line);

      // Attempt to parse grade if not already found
      if (!currentCourse.grade) {
        for (const dataItem of collectedDataForCourse) {
          if (gradePattern.test(dataItem)) {
            currentCourse.grade = dataItem.toUpperCase();
            // Remove grade from buffer so it's not mistaken for credits later
            collectedDataForCourse = collectedDataForCourse.filter(item => item.toUpperCase() !== currentCourse.grade);
            break;
          }
        }
      }

      // Attempt to parse credits if grade is found and credits are not
      if (currentCourse.grade && typeof currentCourse.credits === 'undefined') {
        for (const dataItem of collectedDataForCourse) {
          if (creditsPattern.test(dataItem)) {
            const creditValue = parseFloat(dataItem);
            if (!isNaN(creditValue) && creditValue >= 0) {
              currentCourse.credits = creditValue;
              break;
            }
          }
        }
      }
    }
  }

  // Add the last processed course if it's complete
  if (isValidCourse(currentCourse)) {
    currentCourse.gradePoints = calculateGradePoints(currentCourse.credits!, currentCourse.grade!);
    currentCourse._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    courses.push(currentCourse as Course);
  }

  return courses;
}

/**
 * Create a blank course with default values
 * @returns A new Course object with empty/default values
 */
export function makeBlankCourse(): Course {
  return {
    _uid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    id: "",
    title: "",
    grade: "",
    credits: 0,
    gradePoints: 0,
  };
}

/**
 * Check if a course object has all required fields
 * @param course The course object to validate
 * @returns true if the course has all required fields
 */
function isValidCourse(course: Partial<Course>): boolean {
  return !!(
    course.id &&
    course.title &&
    course.grade &&
    typeof course.credits === "number"
  );
}