import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organizeSemesters } from "@/utils/organizeSemesters";
import { nanoid } from "nanoid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Define the grade point values
const gradePointValues: Record<string, number> = {
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
  "E": 0.0
};

// Course interface
interface Course {
  id: string;
  title: string;
  grade: string;
  credits: number;
  gradePoints: number;
}

// Define academic years
type AcademicYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Summer';

// Semester interface
interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  academicYear?: AcademicYear;
}

export default function GradesPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [rawCourseData, setRawCourseData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null);
  const [newCourseData, setNewCourseData] = useState("");
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [editedSemesterName, setEditedSemesterName] = useState("");
  const [isGradeScaleOpen, setIsGradeScaleOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{
    semesterId: string;
    courseIndex: number;
    field: 'id' | 'title' | 'grade' | 'credits';
    value: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Calculate overall GPA and credits
  const overallStats = semesters.reduce((stats, semester) => {
    return {
      totalCredits: stats.totalCredits + semester.totalCredits,
      totalGradePoints: stats.totalGradePoints + semester.totalGradePoints
    };
  }, { totalCredits: 0, totalGradePoints: 0 });
  
  const overallGPA = overallStats.totalCredits > 0 
    ? Math.round((overallStats.totalGradePoints / overallStats.totalCredits) * 100) / 100 
    : 0;

  // Load saved semesters from localStorage
  useEffect(() => {
    const savedSemesters = localStorage.getItem("gradeSemesters");
    if (savedSemesters) {
      setSemesters(JSON.parse(savedSemesters));
    }
  }, []);

  // Use the organizeSemesters utility to properly organize semesters
  const organizedSections = useMemo(() => {
    return organizeSemesters(semesters);
  }, [semesters]);

  // Save semesters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("gradeSemesters", JSON.stringify(semesters));
  }, [semesters]);

  // Handle drag-end event for semester reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const reorderedSemesters = [...semesters];
    const [removed] = reorderedSemesters.splice(sourceIndex, 1);
    reorderedSemesters.splice(destinationIndex, 0, removed);
    
    setSemesters(reorderedSemesters);
    
    // Order updated silently
  };

  // Parse course data from raw text
  const parseCourseData = (rawData: string): Course[] => {
    if (!rawData || !rawData.trim()) return [];
    
    // Constants for regex patterns
    const COURSE_CODE_RE = /\b[A-Z]{3,4}\d{4}\b/;
    const GRADE_RE = /^(?:A|A-|B\+|B|B-|C\+|C|C-|D\+|D|D-|F|--)(?:\s|$)/i;
    
    // Normalize input: standardize line breaks, trim whitespace, remove empty lines
    const normalizedLines = rawData
      .replace(/\r\n?/g, '\n') // normalize line endings
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean); // remove empty lines
    
    const courses: Course[] = [];
    let cursor = 0;
    
    while (cursor < normalizedLines.length) {
      // Step 1: Find the next line containing a course code
      while (cursor < normalizedLines.length && !COURSE_CODE_RE.test(normalizedLines[cursor])) {
        cursor += 1;
      }
      
      if (cursor >= normalizedLines.length) break; // no more courses
      
      // Extract course ID
      const codeLine = normalizedLines[cursor++];
      const idMatch = codeLine.match(COURSE_CODE_RE);
      const id = idMatch ? idMatch[0] : 'UNKNOWN';
      
      // Step 2: Course title - first non-empty line after the code line
      let title = '';
      if (cursor < normalizedLines.length) {
        // Check if the next line is a title (not a grade or number)
        if (!GRADE_RE.test(normalizedLines[cursor]) && !/^[-+]?\d/.test(normalizedLines[cursor])) {
          title = normalizedLines[cursor++];
        } else {
          // Look for title in the course ID line - extract anything after the course code
          const titleInCodeLine = codeLine.substring(codeLine.indexOf(id) + id.length).trim();
          if (titleInCodeLine) {
            // Remove leading separators like dash or colon
            title = titleInCodeLine.replace(/^[-:]\s*/, '');
          }
        }
      }
      
      // Step 3: Find grade - search for a pattern that looks like a grade
      let grade = 'C'; // Default to C if no grade found
      while (
        cursor < normalizedLines.length && 
        !GRADE_RE.test(normalizedLines[cursor]) && 
        !/^[-+]?\d/.test(normalizedLines[cursor]) &&
        !COURSE_CODE_RE.test(normalizedLines[cursor])
      ) {
        cursor += 1;
      }
      
      if (cursor < normalizedLines.length && GRADE_RE.test(normalizedLines[cursor])) {
        grade = normalizedLines[cursor++].toUpperCase();
      }
      
      // Step 4: Collect numeric values until we hit the next course code
      const numericValues: number[] = [];
      while (cursor < normalizedLines.length && !COURSE_CODE_RE.test(normalizedLines[cursor])) {
        // Try to extract a number from the current line
        const numMatch = normalizedLines[cursor].match(/[-+]?(\d+(\.\d+)?)/);
        if (numMatch) {
          const value = parseFloat(numMatch[1]);
          if (!isNaN(value)) {
            numericValues.push(value);
          }
        }
        cursor += 1;
      }
      
      // Step 5: Determine which number is credits
      // Prefer integers between 1-5 as credits
      let credits = 3.0; // Default
      const creditCandidate = numericValues.find(n => n % 1 === 0 && n >= 1 && n <= 5);
      if (creditCandidate !== undefined) {
        credits = creditCandidate;
      } else if (numericValues.length > 0) {
        // If no good candidate, use the last number
        credits = numericValues[numericValues.length - 1];
      }
      
      // Step 6: Calculate grade points
      const gradePoints = gradePointValues[grade] !== undefined ? 
                          parseFloat((credits * gradePointValues[grade]).toFixed(2)) : 
                          credits * 2.0; // Default to C (2.0) if grade not recognized
      
      // Add the parsed course
      courses.push({
        id,
        title: title || id, // Use ID as title if no title found
        grade,
        credits,
        gradePoints
      });
    }
    
    return courses;
  };

  // Add a new semester
  const addSemester = () => {
    // If no courses data is entered, create empty semester
    if (!rawCourseData.trim()) {
      const newSemesterId = Date.now().toString();
      
      const newSemester: Semester = {
        id: newSemesterId,
        name: newSemesterName || "New Semester",
        courses: [],
        totalCredits: 0,
        totalGradePoints: 0,
        gpa: 0
      };
      
      setSemesters(prev => [...prev, newSemester]);
      setNewSemesterName("");
      setIsDialogOpen(false);
      
      // Start editing the semester name immediately if using default
      if (!newSemesterName) {
        setTimeout(() => {
          startEditingSemesterName(newSemesterId, "New Semester");
        }, 100);
      }
      return;
    }

    // Otherwise proceed with course data
    const courses = parseCourseData(rawCourseData);
    
    if (courses.length === 0) {
      toast({
        title: "Error",
        description: "Could not parse any valid courses from the input",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate semester totals
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalGradePoints = courses.reduce((sum, course) => sum + (course.credits * course.gradePoints), 0);
    const gpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
    
    const newSemester: Semester = {
      id: Date.now().toString(),
      name: newSemesterName || "New Semester",
      courses,
      totalCredits,
      totalGradePoints,
      gpa
    };
    
    setSemesters(prev => [...prev, newSemester]);
    setNewSemesterName("");
    setRawCourseData("");
    setIsDialogOpen(false);
    
    // Semester added silently
  };

  // Create a placeholder course the user can fill in later
const makeBlankCourse = (): Course => ({
  id: nanoid(6),          // keeps Drag-n-Drop stable
  title: "",
  grade: "",
  credits: 0,
  gradePoints: 0,
});

// Add course to existing semester
const addCourseToSemester = () => {
  if (!currentSemesterId) return;

  // Decide what we're adding
  let coursesToAdd: Course[];

  if (newCourseData.trim()) {
    // User pasted something → try to parse it
    const parsed = parseCourseData(newCourseData);

    if (parsed.length === 0) {
      toast({
        title: "Error",
        description: "Could not parse any valid courses from the input",
        variant: "destructive",
      });
      return;
    }
    coursesToAdd = parsed;
  } else {
    // Blank form → add ONE editable placeholder
    coursesToAdd = [makeBlankCourse()];
  }

  // Update the right semester
  setSemesters((prev) =>
    prev.map((semester) => {
      if (semester.id !== currentSemesterId) return semester;

      const updatedCourses = [...semester.courses, ...coursesToAdd];

      const totalCredits = updatedCourses.reduce(
        (sum, c) => sum + c.credits,
        0
      );
      const totalGradePoints = updatedCourses.reduce(
        (sum, c) => sum + c.credits * c.gradePoints,
        0
      );

      return {
        ...semester,
        courses: updatedCourses,
        totalCredits,
        totalGradePoints,
        gpa:
          totalCredits > 0
            ? parseFloat((totalGradePoints / totalCredits).toFixed(2))
            : 0,
      };
    })
  );

  // Clean-up dialog state
  setNewCourseData("");
  setIsAddCourseDialogOpen(false);
};

  // Remove a semester
  const removeSemester = (id: string) => {
    setSemesters(prev => prev.filter(semester => semester.id !== id));
    
    // Semester removed silently
  };

  // Start editing a semester name
  const startEditingSemesterName = (id: string, currentName: string) => {
    setEditingSemesterId(id);
    setEditedSemesterName(currentName);
    
    // Focus the input field after it renders
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  // Save edited semester name
  const saveEditedSemesterName = () => {
    if (!editingSemesterId) return;
    
    setSemesters(prev => 
      prev.map(semester => 
        semester.id === editingSemesterId 
          ? { ...semester, name: editedSemesterName || semester.name } 
          : semester
      )
    );
    
    setEditingSemesterId(null);
    setEditedSemesterName("");
    
    // Name updated silently
  };

  // Start editing a course field
  const startEditingCourse = (
    semesterId: string, 
    courseIndex: number, 
    field: 'id' | 'title' | 'grade' | 'credits', 
    currentValue: string
  ) => {
    setEditingCourse({ 
      semesterId, 
      courseIndex, 
      field, 
      value: currentValue 
    });
    
    // Focus the input field after it renders
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  // Save edited course field
  const saveEditedCourse = () => {
    if (!editingCourse) return;
    
    const { semesterId, courseIndex, field, value } = editingCourse;
    
    // Special validation for credits (must be a number)
    if (field === 'credits') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        toast({
          title: "Invalid Credits",
          description: "Credits must be a positive number",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSemesters(prev => {
      return prev.map(semester => {
        if (semester.id === semesterId) {
          const updatedCourses = [...semester.courses];
          const course = { ...updatedCourses[courseIndex] };
          
          if (field === 'id') {
            course.id = value;
          } else if (field === 'title') {
            course.title = value;
          } else if (field === 'grade') {
            course.grade = value.toUpperCase();
            // Recalculate grade points
            const gradePoint = gradePointValues[course.grade] !== undefined ? 
                              gradePointValues[course.grade] : 
                              2.0; // Default to C (2.0)
            course.gradePoints = parseFloat((course.credits * gradePoint).toFixed(2));
          } else if (field === 'credits') {
            const numValue = parseFloat(value);
            course.credits = numValue;
            // Recalculate grade points
            const gradePoint = gradePointValues[course.grade] !== undefined ? 
                              gradePointValues[course.grade] : 
                              2.0; // Default to C (2.0)
            course.gradePoints = parseFloat((numValue * gradePoint).toFixed(2));
          }
          
          updatedCourses[courseIndex] = course;
          
          // Recalculate semester totals
          const totalCredits = updatedCourses.reduce((sum, c) => sum + c.credits, 0);
          const totalGradePoints = updatedCourses.reduce((sum, c) => sum + c.gradePoints, 0);
          const gpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
          
          return {
            ...semester,
            courses: updatedCourses,
            totalCredits,
            totalGradePoints,
            gpa
          };
        }
        return semester;
      })
    });
    
    setEditingCourse(null);
    
    // Course information updated silently
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Grades & Forecasting</h1>
          <div className="flex mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg justify-between items-center">
            <div>
              <h3 className="text-xl font-medium">Overall GPA</h3>
              <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">{overallGPA.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Total Credits</h3>
              <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">{overallStats.totalCredits.toFixed(1)}</p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Total Grade Points</h3>
              <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">{overallStats.totalGradePoints.toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Semesters</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Add Semester</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Semester</DialogTitle>
                  <DialogDescription>
                    Enter a name for the semester and optionally add course information.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Semester Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g., Fall 2023" 
                      value={newSemesterName}
                      onChange={(e) => setNewSemesterName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courseData">Course Information (Optional)</Label>
                    <Textarea 
                      id="courseData" 
                      placeholder="Enter course information"
                      rows={10}
                      value={rawCourseData}
                      onChange={(e) => setRawCourseData(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Format: Course ID, Course Title, Grade, Credits (one per line)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={addSemester}>Add Semester</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {semesters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No semesters added yet.</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Click "Add Semester" to get started.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="semesters" type="SEMESTERS">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {organizedSections.map((section) => {
                        // Skip sections with no semesters
                        if (section.semesters.length === 0) return null;
                        
                        return (
                          <div key={section.label} className="mb-6">
                            <h3 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-300">
                              {section.label}
                            </h3>
                            <Accordion type="single" collapsible className="w-full mb-4">
                              {section.semesters.map((semester) => {
                                // Find the actual index in the complete list
                                const semesterIndex = semesters.findIndex(s => s.id === semester.id);
                                
                                return (
                                  <Draggable 
                                    key={semester.id} 
                                    draggableId={semester.id} 
                                    index={semesterIndex}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="mb-2"
                                      >
                                        <AccordionItem value={semester.id} className="border rounded-md overflow-hidden">
                                          <ContextMenu>
                                            <ContextMenuTrigger className="w-full block">
                                              <AccordionTrigger 
                                                {...provided.dragHandleProps}
                                                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                                              >
                                                <div className="flex items-center justify-between w-full pr-4">
                                                  <div className="flex items-center">
                                                    {editingSemesterId === semester.id ? (
                                                      <form 
                                                        onSubmit={(e) => {
                                                          e.preventDefault();
                                                          saveEditedSemesterName();
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex"
                                                      >
                                                        <Input
                                                          ref={inputRef}
                                                          className="h-8 min-w-[200px] text-xl font-medium border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                          value={editedSemesterName}
                                                          onChange={(e) => setEditedSemesterName(e.target.value)}
                                                          onBlur={saveEditedSemesterName}
                                                          onKeyDown={(e) => {
                                                            if (e.key === "Escape") {
                                                              setEditingSemesterId(null);
                                                              setEditedSemesterName("");
                                                            }
                                                          }}
                                                        />
                                                      </form>
                                                    ) : (
                                                      <span 
                                                        className="text-xl font-medium cursor-text"
                                                        onClick={(e) => {
                                                          if (e.detail === 3) { // Triple click
                                                            e.stopPropagation();
                                                            startEditingSemesterName(semester.id, semester.name);
                                                          }
                                                        }}
                                                        title="Triple-click to edit"
                                                      >
                                                        {semester.name}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-5">
                                                    <div className="text-right">
                                                      <span className="text-sm text-gray-500">GPA</span>
                                                      <p className="font-semibold min-w-[3ch] text-right">{semester.gpa.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                      <span className="text-sm text-gray-500">Credits</span>
                                                      <p className="font-semibold min-w-[3ch] text-right">{semester.totalCredits.toFixed(1)}</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </AccordionTrigger>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                              <ContextMenuItem 
                                                onClick={() => {
                                                  setCurrentSemesterId(semester.id);
                                                  setIsAddCourseDialogOpen(true);
                                                }}
                                              >
                                                Add Course
                                              </ContextMenuItem>
                                              <ContextMenuSeparator />
                                              <ContextMenuItem 
                                                onClick={() => removeSemester(semester.id)}
                                                className="text-red-500 hover:text-red-600 focus:text-red-600"
                                              >
                                                Delete Semester
                                              </ContextMenuItem>
                                            </ContextMenuContent>
                                          </ContextMenu>
                                          <AccordionContent className="px-4 pt-2 pb-4">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-32">Course ID</TableHead>
                                                  <TableHead>Course Title</TableHead>
                                                  <TableHead className="w-20 text-center">Grade</TableHead>
                                                  <TableHead className="w-20 text-center">Credits</TableHead>
                                                  <TableHead className="w-32 text-center">Grade Points</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {semester.courses.length === 0 ? (
                                                  <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                      No courses added yet. Right-click the semester and select "Add Course" to add courses.
                                                    </TableCell>
                                                  </TableRow>
                                                ) : (
                                                  <>
                                                    {semester.courses.map((course, i) => {
                                                      const points = course.credits * (gradePointValues[course.grade] || 2.0);
                                                      
                                                      return (
                                                        <TableRow key={i}>
                                                          <TableCell className="font-medium">
                                                            {editingCourse && 
                                                              editingCourse.semesterId === semester.id && 
                                                              editingCourse.courseIndex === i && 
                                                              editingCourse.field === 'id' ? (
                                                              <form 
                                                                onSubmit={(e) => {
                                                                  e.preventDefault();
                                                                  saveEditedCourse();
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex"
                                                              >
                                                                <Input
                                                                  ref={inputRef}
                                                                  className="h-8 border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                                  value={editingCourse.value}
                                                                  onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                  onBlur={saveEditedCourse}
                                                                  onKeyDown={(e) => {
                                                                    if (e.key === "Escape") {
                                                                      setEditingCourse(null);
                                                                    }
                                                                  }}
                                                                />
                                                              </form>
                                                            ) : (
                                                              <span 
                                                                className="cursor-text"
                                                                onClick={(e) => {
                                                                  if (e.detail === 3) { // Triple click
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'id', course.id);
                                                                  }
                                                                }}
                                                                title="Triple-click to edit"
                                                              >
                                                                {course.id}
                                                              </span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell>
                                                            {editingCourse && 
                                                              editingCourse.semesterId === semester.id && 
                                                              editingCourse.courseIndex === i && 
                                                              editingCourse.field === 'title' ? (
                                                              <form 
                                                                onSubmit={(e) => {
                                                                  e.preventDefault();
                                                                  saveEditedCourse();
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex"
                                                              >
                                                                <Input
                                                                  ref={inputRef}
                                                                  className="h-8 border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                                  value={editingCourse.value}
                                                                  onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                  onBlur={saveEditedCourse}
                                                                  onKeyDown={(e) => {
                                                                    if (e.key === "Escape") {
                                                                      setEditingCourse(null);
                                                                    }
                                                                  }}
                                                                />
                                                              </form>
                                                            ) : (
                                                              <span 
                                                                className="cursor-text"
                                                                onClick={(e) => {
                                                                  if (e.detail === 3) { // Triple click
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'title', course.title);
                                                                  }
                                                                }}
                                                                title="Triple-click to edit"
                                                              >
                                                                {course.title}
                                                              </span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-center">
                                                            {editingCourse && 
                                                              editingCourse.semesterId === semester.id && 
                                                              editingCourse.courseIndex === i && 
                                                              editingCourse.field === 'grade' ? (
                                                              <form 
                                                                onSubmit={(e) => {
                                                                  e.preventDefault();
                                                                  saveEditedCourse();
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex justify-center"
                                                              >
                                                                <Input
                                                                  ref={inputRef}
                                                                  className="h-8 w-20 text-center border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                                  value={editingCourse.value}
                                                                  onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                  onBlur={saveEditedCourse}
                                                                  onKeyDown={(e) => {
                                                                    if (e.key === "Escape") {
                                                                      setEditingCourse(null);
                                                                    }
                                                                  }}
                                                                />
                                                              </form>
                                                            ) : (
                                                              <span 
                                                                className="cursor-text"
                                                                onClick={(e) => {
                                                                  if (e.detail === 3) { // Triple click
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'grade', course.grade);
                                                                  }
                                                                }}
                                                                title="Triple-click to edit"
                                                              >
                                                                {course.grade}
                                                              </span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-center">
                                                            {editingCourse && 
                                                              editingCourse.semesterId === semester.id && 
                                                              editingCourse.courseIndex === i && 
                                                              editingCourse.field === 'credits' ? (
                                                              <form 
                                                                onSubmit={(e) => {
                                                                  e.preventDefault();
                                                                  saveEditedCourse();
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex justify-center"
                                                              >
                                                                <Input
                                                                  ref={inputRef}
                                                                  className="h-8 w-20 text-center border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                                  value={editingCourse.value}
                                                                  onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                  onBlur={saveEditedCourse}
                                                                  onKeyDown={(e) => {
                                                                    if (e.key === "Escape") {
                                                                      setEditingCourse(null);
                                                                    }
                                                                  }}
                                                                />
                                                              </form>
                                                            ) : (
                                                              <span 
                                                                className="cursor-text"
                                                                onClick={(e) => {
                                                                  if (e.detail === 3) { // Triple click
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'credits', course.credits.toString());
                                                                  }
                                                                }}
                                                                title="Triple-click to edit"
                                                              >
                                                                {course.credits.toFixed(1)}
                                                              </span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-center">{points.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                      );
                                                    })}
                                                  </>
                                                )}
                                              </TableBody>
                                            </Table>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </Accordion>
                          </div>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for adding course to existing semester */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>
              Enter course information to add to this semester.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="courseData">Course Information</Label>
              <Textarea 
                id="courseData" 
                placeholder="Enter course information"
                rows={10}
                value={newCourseData}
                onChange={(e) => setNewCourseData(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Format: Course ID, Course Title, Grade, Credits (one per line)
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={addCourseToSemester}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collapsible showing grade point values */}
      <Collapsible 
        open={isGradeScaleOpen} 
        onOpenChange={setIsGradeScaleOpen}
        className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-72 z-10 mx-auto overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full flex justify-between items-center p-4">
            <span>Grade Point Scale</span>
            <span>{isGradeScaleOpen ? '▼' : '▲'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2 px-6">Grade</TableHead>
                <TableHead className="w-1/2 px-6 text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(gradePointValues).map(([grade, points]) => (
                <TableRow key={grade}>
                  <TableCell className="px-6">{grade}</TableCell>
                  <TableCell className="px-6 text-right">{points.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}