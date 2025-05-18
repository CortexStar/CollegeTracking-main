import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect, useMemo } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { ProgressCircle } from "@/components/progress-circle";

// Updated ExamEntry interface (should match the one in new.tsx or be imported)
interface ExamEntry {
  id: string;
  classCode?: string;
  classTitle: string;
  examName: string;
  examNumber?: number | null;
  examDate: string;
  source: 'pdf' | 'manual';
  completed?: boolean;
}

interface GroupedExams {
  [key: string]: ExamEntry[];
}

export default function ExamsPage() {
  const [viewMode, setViewMode] = useState("chronological");
  const [parsedExams, setParsedExams] = useState<ExamEntry[]>([]);
  const [location] = useLocation();

  useEffect(() => {
    console.log("ExamsPage: useEffect triggered due to location change or mount. Current path:", location);
    const storedExams = localStorage.getItem('parsedExamsData');
    if (storedExams) {
      try {
        const exams: ExamEntry[] = JSON.parse(storedExams);
        setParsedExams(exams);
      } catch (error) {
        console.error("Error parsing exams from localStorage:", error);
        setParsedExams([]);
      }
    } else {
      setParsedExams([]);
    }
  }, [location]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', day: 'numeric' });
  };

  const getMonthYear = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long' });
  };

  const handleDeleteExam = (examId: string) => {
    setParsedExams(prev => {
      const updated = prev.filter(exam => exam.id !== examId);
      localStorage.setItem('parsedExamsData', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleComplete = (examId: string) => {
    setParsedExams(prev => {
      const updated = prev.map(exam => 
        exam.id === examId ? { ...exam, completed: !exam.completed } : exam
      );
      localStorage.setItem('parsedExamsData', JSON.stringify(updated));
      return updated;
    });
  };

  const groupedExams = useMemo(() => {
    if (viewMode === "chronological") {
      // Group by month and year
      const grouped: GroupedExams = {};
      parsedExams.forEach(exam => {
        const monthYear = getMonthYear(exam.examDate);
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(exam);
      });

      // Sort months chronologically
      return Object.entries(grouped)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .reduce((acc, [key, value]) => {
          acc[key] = value.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
          return acc;
        }, {} as GroupedExams);
    } else {
      // Group by class
      const grouped: GroupedExams = {};
      parsedExams.forEach(exam => {
        const classKey = exam.classCode ? `${exam.classCode}: ${exam.classTitle}` : exam.classTitle;
        if (!grouped[classKey]) {
          grouped[classKey] = [];
        }
        grouped[classKey].push(exam);
      });

      // Sort classes alphabetically
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [key, value]) => {
          acc[key] = value.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
          return acc;
        }, {} as GroupedExams);
    }
  }, [parsedExams, viewMode]);

  const calculateProgress = () => {
    if (parsedExams.length === 0) return 0;
    const completedCount = parsedExams.filter(exam => exam.completed).length;
    return Math.round((completedCount / parsedExams.length) * 100);
  };

  return (
    <div className="container py-6 pb-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6">
        <h1 className="text-3xl font-bold">Exam Calendar</h1>
        <div className="flex items-center gap-2">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => { if (value) setViewMode(value); }}
            className="border border-slate-300 dark:border-slate-700 rounded-full overflow-hidden backdrop-blur-sm"
          >
            <ToggleGroupItem value="chronological" className="px-4 py-1">Chronological</ToggleGroupItem>
            <ToggleGroupItem value="classes" className="px-4 py-1">Classes</ToggleGroupItem>
          </ToggleGroup>
          <Button asChild size="sm" variant="outline">
            <Link href="/exams/new">Add Exams</Link>
          </Button>
        </div>
      </div>
      <div className="mt-6">
        {parsedExams.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedExams).map(([group, exams]) => (
              <div key={group}>
                <h2 className="text-xl font-semibold mb-4 uppercase tracking-wider">{group}</h2>
                <ul className="space-y-3">
                  {exams.map(exam => (
                    <ContextMenu key={exam.id}>
                      <ContextMenuTrigger asChild>
                        <li className={`p-4 border rounded-lg shadow-sm bg-card hover:bg-muted/50 cursor-pointer ${exam.completed ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">
                              {viewMode === "chronological" ? (
                                <>
                                  {exam.classCode && <span className="text-muted-foreground">{exam.classCode}: </span>}
                                  {exam.classTitle} - {exam.examName}
                                </>
                              ) : (
                                exam.examName
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(exam.examDate)}
                            </span>
                          </div>
                        </li>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem 
                          onClick={() => handleToggleComplete(exam.id)}
                          className={exam.completed ? "text-green-600" : "text-muted-foreground"}
                        >
                          {exam.completed ? "Mark as Incomplete" : "Mark as Complete"}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-destructive focus:text-destructive-foreground focus:bg-destructive/90"
                        >
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No Exams Found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload syllabuses or add exams manually to see them here.</p>
            <div className="mt-6">
                <Button asChild>
                    <Link href="/exams/new">Add Exams</Link>
                </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 