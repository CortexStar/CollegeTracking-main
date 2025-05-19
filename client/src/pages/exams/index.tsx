import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { ProgressCircle } from "@/components/progress-circle";
import { ExamCalendarView } from "@/components/ExamCalendarView";
import { AnimatePresence, motion } from "framer-motion";

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
  const [location, navigate] = useLocation();
  const viewModeChangedByButton = useRef(false);
  const [animationTriggerKey, setAnimationTriggerKey] = useState(0);

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
    // DO NOT setAnimationTriggerKey here. This effect is for loading data.
  }, [location]);

  useEffect(() => {
    // Reset the flag after the animation cycle completes
    if (viewModeChangedByButton.current) {
      viewModeChangedByButton.current = false;
    }
  }, [animationTriggerKey]); // Depend on animationTriggerKey

  const formatDate = (dateString: string): string => {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
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
        <h1 className="text-3xl font-bold">Exams</h1>
        <div className="flex items-center gap-2">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => { 
              if (value && value !== viewMode) {
                viewModeChangedByButton.current = true;
                setViewMode(value); 
                setAnimationTriggerKey(prev => prev + 1);
              }
            }}
            className="border border-slate-300 dark:border-slate-700 rounded-full overflow-hidden backdrop-blur-sm"
          >
            <ToggleGroupItem value="chronological" className="px-4 py-1">Chronological</ToggleGroupItem>
            <ToggleGroupItem value="classes" className="px-4 py-1">Classes</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="mt-6">
        <ContextMenu>
          <ContextMenuTrigger>
            <AnimatePresence mode="wait" initial={false}>
              {parsedExams.length > 0 ? (
                <motion.div
                  key={`${viewMode}-${animationTriggerKey}`}
                  initial={viewModeChangedByButton.current ? { opacity: 0, x: 64 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -64 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-8"
                >
                  {Object.entries(groupedExams).map(([group, exams]) => (
                    <div key={group}>
                      <h2 className="text-xl font-semibold mb-4 uppercase tracking-wider">{group}</h2>
                      <ul className="space-y-3">
                        {exams.map(exam => (
                          <ContextMenu key={exam.id}>
                            <ContextMenuTrigger asChild>
                              <li className={`p-4 border rounded-lg shadow-sm bg-card cursor-pointer ${exam.completed ? 'bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/40' : 'hover:bg-muted/50'}`}>
                                <div className="flex justify-between items-center">
                                  <div className="text-sm text-muted-foreground">
                                    {viewMode === "chronological" ? (
                                      <>
                                        {exam.classCode && <span>{exam.classCode}: </span>}
                                        {exam.classTitle} - {exam.examName}
                                      </>
                                    ) : (
                                      exam.examName
                                    )}
                                  </div>
                                  <span className="text-sm text-black dark:text-white">
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
                              <ContextMenuSeparator />
                              <ContextMenuItem onClick={() => navigate("/exams/new")}>
                                Add New Exam
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, x: 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -64 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="text-center py-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No Exams Found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload syllabuses or add exams manually to see them here.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => navigate("/exams/new")}>
              Add New Exam
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {/* Calendar heading */}
        <div className="mt-16 mb-6">
          <h2 className="text-3xl font-bold border-b-2 border-black pb-2">Calendar</h2>
        </div>
        <ExamCalendarView exams={parsedExams} />
      </div>
    </div>
  );
} 