import React, { useMemo, useRef, useEffect, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const zoomVariants = {
  enter: (direction: number) => ({ opacity: 0, scale: direction === 1 ? 0.92 : 1.08 }),
  center: { opacity: 1, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, scale: direction === 1 ? 1.08 : 0.92 }),
};

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({ exams }) => {
  const [viewMode, setViewMode] = useState<'single' | 'overview'>('overview');
  const [pendingMonthIdx, setPendingMonthIdx] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1); // 1: to month, -1: to overview

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    slides: { 
      perView: 1, 
      spacing: 0,
    },
    mode: "snap",
    rubberband: false,
    loop: true,
    defaultAnimation: {
      duration: 650,
      easing: (t: number) => 1 - Math.pow(1 - t, 5),
    },
    slideChanged(s) {
      setCurrentIdx(s.track.details.rel);
    },
  });

  // Initialize the slider to the correct month when created or when the view mode changes
  useEffect(() => {
    if (viewMode === 'single' && instanceRef.current && pendingMonthIdx !== null) {
      instanceRef.current.moveToIdx(pendingMonthIdx);
      setCurrentIdx(pendingMonthIdx);
      setPendingMonthIdx(null);
    }
  }, [viewMode, pendingMonthIdx, instanceRef]);

  // Helper: get month name (show year only if multiple years)
  const years = useMemo(() => Array.from(new Set(allMonths.map(m => m.getFullYear()))), [allMonths]);
  const showYear = years.length > 1;
  const getMonthName = (month: Date) => month.toLocaleString("default", { month: "long" }) + (showYear ? ` ${month.getFullYear()}` : "");

  // --- RENDER ---
  return (
    <div className="w-full mt-12">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {viewMode === 'overview' ? (
          <motion.div
            key="overview"
            custom={direction}
            variants={zoomVariants}
            initial={direction === -1 ? "enter" : false}
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              <AnimatePresence>
                {allMonths.map((month, idx) => {
                  const year = month.getFullYear();
                  const m = month.getMonth();
                  const days = getMonthDays(year, m);
                  return (
                    <motion.div 
                      key={getMonthKey(month)}
                      layout 
                      exit={{ opacity: 0, scale: 0.75, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl shadow-sm bg-white dark:bg-card p-4 flex flex-col items-center cursor-pointer hover:bg-muted/40 transition"
                      onClick={() => { 
                        setPendingMonthIdx(idx); 
                        setDirection(1); 
                        setViewMode('single');
                      }}
                    >
                      <div className={MONTH_HEADING}>
                        {getMonthName(month)}
                      </div>
                      <div className="grid grid-cols-7 gap-1 w-full">
                        {days.map(day => {
                          const dateStr = day.toISOString().slice(0, 10);
                          const examsOnDay = examDaysMap.get(dateStr);
                          const hasExam = !!examsOnDay;
                          const isCompleted = hasExam && examsOnDay.some(e => e.completed);
                          let color = hasExam ? (isCompleted ? GREEN : RED) : "border-transparent";
                          let hover = hasExam ? (isCompleted ? GREEN_HOVER : RED_HOVER) : HOVER;
                          return (
                            <div
                              key={dateStr}
                              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium border transition-colors duration-200 ${color} ${hover} cursor-pointer`}
                              style={{ minHeight: 28 }}
                              title={hasExam ? examsOnDay?.map(e => e.examName).join(", ") : undefined}
                              tabIndex={0}
                            >
                              {day.getDate()}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="single"
            custom={direction}
            variants={zoomVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
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
                        className={MONTH_HEADING + " cursor-pointer"}
                        onClick={() => { setDirection(-1); setViewMode('overview'); }}
                        tabIndex={0}
                        role="button"
                        aria-label="Show all months overview"
                      >
                        {monthName}
                      </div>
                      <div className="grid grid-cols-7 gap-1 w-full">
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
              {allMonths.length > 0 && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1/6 group z-10"> {/* Hover area for left arrow */}
                    <button
                      onClick={() => {
                        if (!instanceRef.current || allMonths.length === 0) return;
                        instanceRef.current?.prev();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-800/10 hover:bg-gray-800/25 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  </div>

                  {/* Right Hover Area & Arrow */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/6 group z-10"> {/* Hover area for right arrow */}
                    <button
                      onClick={() => {
                        if (!instanceRef.current || allMonths.length === 0) return;
                        instanceRef.current?.next();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-800/10 hover:bg-gray-800/25 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                      aria-label="Next month"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 