import React, { useMemo, useRef, useEffect, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

interface ExamEntry {
  id: string;
  classCode?: string;
  classTitle: string;
  examName: string;
  examNumber?: number | null;
  examDate: string; // YYYY-MM-DD
  source: 'pdf' | 'manual';
  completed?: boolean;
}

interface ExamCalendarViewProps {
  exams: ExamEntry[];
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1));
}

const GREEN = "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
const GREEN_HOVER = "hover:bg-green-100 dark:hover:bg-green-900/40";
const RED = "bg-red-50 border-red-200";
const RED_HOVER = "hover:bg-red-100";
const HOVER = "hover:bg-muted/50 hover:border-muted-300";
const MONTH_HEADING = "text-xl font-semibold uppercase tracking-wider mb-4 select-none";

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({ exams }) => {
  const [viewMode, setViewMode] = useState<'single' | 'overview'>('single');
  const [pendingMonthIdx, setPendingMonthIdx] = useState<number | null>(null);

  // Group exams by month
  const monthsWithExams = useMemo(() => {
    const map = new Map<string, { date: Date; exams: ExamEntry[] }>();
    exams.forEach(exam => {
      const date = new Date(exam.examDate);
      const key = getMonthKey(date);
      if (!map.has(key)) {
        map.set(key, { date: new Date(date.getFullYear(), date.getMonth(), 1), exams: [] });
      }
      map.get(key)!.exams.push(exam);
    });
    // Sort by date
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [exams]);

  // All months to show (including months with no exams between first and last)
  const allMonths = useMemo(() => {
    if (monthsWithExams.length === 0) return [];
    const first = monthsWithExams[0].date;
    const last = monthsWithExams[monthsWithExams.length - 1].date;
    const months: Date[] = [];
    let d = new Date(first);
    while (d <= last) {
      months.push(new Date(d));
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  }, [monthsWithExams]);

  // Map of exam days for quick lookup
  const examDaysMap = useMemo(() => {
    const map = new Map<string, ExamEntry[]>();
    exams.forEach(exam => {
      map.set(exam.examDate, (map.get(exam.examDate) || []).concat(exam));
    });
    return map;
  }, [exams]);

  // Keen-slider setup
  const [currentIdx, setCurrentIdx] = useState(
    Math.max(0, monthsWithExams.length ? allMonths.findIndex(m => getMonthKey(m) === getMonthKey(monthsWithExams[0].date)) : 0)
  );
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: currentIdx,
    slides: { perView: 1, spacing: 0 },
    mode: "free",
    rubberband: true,
    dragEnded(s: any) {
      // Snap to nearest slide after drag ends
      const idx = Math.round(s.track.details.abs);
      s.moveToIdx(idx, true);
      setCurrentIdx(idx);
    },
  });

  // When returning from overview, scroll to the selected month
  useEffect(() => {
    if (viewMode === 'single' && pendingMonthIdx !== null && instanceRef.current) {
      instanceRef.current.moveToIdx(pendingMonthIdx, true);
      setPendingMonthIdx(null);
    }
  }, [viewMode, pendingMonthIdx, instanceRef]);

  // Helper: get month name (show year only if multiple years)
  const years = useMemo(() => Array.from(new Set(allMonths.map(m => m.getFullYear()))), [allMonths]);
  const showYear = years.length > 1;
  const getMonthName = (month: Date) => month.toLocaleString("default", { month: "long" }) + (showYear ? ` ${month.getFullYear()}` : "");

  // --- RENDER ---
  if (viewMode === 'overview') {
    return (
      <div className="w-full mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {allMonths.map((month, idx) => {
            const year = month.getFullYear();
            const m = month.getMonth();
            const days = getMonthDays(year, m);
            return (
              <div
                key={getMonthKey(month)}
                className="rounded-xl shadow-sm bg-white dark:bg-card p-4 flex flex-col items-center cursor-pointer hover:bg-muted/40 transition"
                onClick={() => { setPendingMonthIdx(idx); setViewMode('single'); }}
              >
                <div className={MONTH_HEADING}>
                  {getMonthName(month)}
                </div>
                <div className="grid grid-cols-7 gap-1 w-full">
                  {[...Array(new Date(year, m, 1).getDay())].map((_, i) => (
                    <div key={i} />
                  ))}
                  {days.map(day => {
                    const dateStr = day.toISOString().slice(0, 10);
                    const exams = examDaysMap.get(dateStr);
                    const hasExam = !!exams;
                    const isCompleted = hasExam && exams.some(e => e.completed);
                    let color = hasExam ? (isCompleted ? GREEN : RED) : "border-transparent";
                    let hover = hasExam ? (isCompleted ? GREEN_HOVER : RED_HOVER) : HOVER;
                    return (
                      <div
                        key={dateStr}
                        className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium border transition-colors duration-200 ${color} ${hover} cursor-pointer`}
                        style={{ minHeight: 28 }}
                        title={hasExam ? exams?.map(e => e.examName).join(", ") : undefined}
                        tabIndex={0}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- SINGLE MONTH SLIDER ---
  return (
    <div className="w-full mt-12">
      <div className="relative overflow-x-hidden">
        <div ref={sliderRef} className="keen-slider rounded-xl shadow-sm bg-white dark:bg-card w-full touch-pan-x cursor-grab">
          {allMonths.map((month, idx) => {
            const year = month.getFullYear();
            const m = month.getMonth();
            const days = getMonthDays(year, m);
            const monthName = getMonthName(month);
            return (
              <div key={getMonthKey(month)} className="keen-slider__slide flex flex-col items-center justify-start min-h-[340px] p-6 min-w-full max-w-full">
                <div
                  className={MONTH_HEADING + " cursor-pointer hover:underline"}
                  onClick={() => setViewMode('overview')}
                  tabIndex={0}
                  role="button"
                  aria-label="Show all months overview"
                >
                  {monthName}
                </div>
                <div className="grid grid-cols-7 gap-1 w-full">
                  {[...Array(new Date(year, m, 1).getDay())].map((_, i) => (
                    <div key={i} />
                  ))}
                  {days.map(day => {
                    const dateStr = day.toISOString().slice(0, 10);
                    const exams = examDaysMap.get(dateStr);
                    const hasExam = !!exams;
                    const isCompleted = hasExam && exams.some(e => e.completed);
                    let color = hasExam ? (isCompleted ? GREEN : RED) : "border-transparent";
                    let hover = hasExam ? (isCompleted ? GREEN_HOVER : RED_HOVER) : HOVER;
                    return (
                      <div
                        key={dateStr}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium border transition-colors duration-200 ${color} ${hover} cursor-pointer`}
                        style={{ minHeight: 36 }}
                        title={hasExam ? exams?.map(e => e.examName).join(", ") : undefined}
                        tabIndex={0}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 