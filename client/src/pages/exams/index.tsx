import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect } from 'react';

// Updated ExamEntry interface (should match the one in new.tsx or be imported)
interface ExamEntry {
  id: string;
  classCode?: string;
  classTitle: string;
  examName: string;
  examNumber?: number | null;
  examDate: string;
  source: 'pdf' | 'manual'; 
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
        // localStorage.removeItem('parsedExamsData'); // Optional: Clear after load if only needed once per navigation
      } catch (error) {
        console.error("Error parsing exams from localStorage:", error);
        setParsedExams([]);
      }
    } else {
      // Ensure if localStorage is empty or cleared, the state reflects that
      setParsedExams([]);
    }
  }, [location]);

  const displayExamNumber = (num?: number | null) => {
    if (num === null) return ' (Final)';
    if (typeof num === 'number') return ` ${num}`;
    return '';
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
        {/* For now, both views will just list all exams. Grouping/sorting to be added later. */}
        {parsedExams.length > 0 ? (
          <ul className="space-y-3">
            {parsedExams.map(exam => (
              <li key={exam.id} className="p-4 border rounded-lg shadow-sm bg-card">
                <div className="font-semibold text-lg">
                  {exam.classCode && <span className="text-muted-foreground">{exam.classCode} - </span>}
                  {exam.classTitle}
                </div>
                <div className="mt-1">
                  <span className="text-primary">{exam.examName}</span>
                  <span className="text-sm text-muted-foreground float-right">{exam.examDate}</span>
                </div>
                {/* <p className="text-xs text-gray-500">Source: {exam.source}, ID: {exam.id}</p> */}
              </li>
            ))}
          </ul>
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