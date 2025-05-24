import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { ProblemSet as ProblemSetType } from "@/data/problem-sets";
import SolutionUpload from "@/components/solution-upload";
import LectureItem from "@/components/lecture-item";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

interface ProblemSetProps {
  problemSet: ProblemSetType;
  isActive: boolean;
  isCompleted?: boolean;
  onToggleCompletion?: () => void;
}

/**
 * ProblemSet card with smooth expand/collapse and a right‑click context menu.
 * Requirements handled:
 * 1. Scrolling is always allowed (no scroll‑lock styles applied).
 * 2. Any page scroll automatically hides the context menu.
 * 3. Selecting a menu option also hides it.
 * The green "completed" highlight remains header‑only.
 */
export default function ProblemSet({
  problemSet,
  isActive,
  isCompleted = false,
  onToggleCompletion,
}: ProblemSetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMobile();

  // Measure the true height of the content so we can animate from 0 → px.
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Re‑measure every time the dropdown opens or the data set changes.
  useLayoutEffect(() => {
    if (isExpanded && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, problemSet]);

  // Close the context‑menu on any scroll or click outside.
  useEffect(() => {
    if (!isMenuOpen) return;

    const closeMenu = () => setIsMenuOpen(false);

    window.addEventListener("scroll", closeMenu, { passive: true });
    document.addEventListener("mousedown", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu);
      document.removeEventListener("mousedown", closeMenu);
    };
  }, [isMenuOpen]);

  return (
    <ContextMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <ContextMenuTrigger asChild>
        <Card
          id={problemSet.id}
          className="mb-10 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          {/* Header (right‑click anywhere in card triggers the menu) */}
          <CardHeader
            className={cn(
              "px-10 py-7 border-b border-gray-200 dark:border-gray-700 flex flex-row items-center cursor-pointer select-none transition-colors",
              isCompleted
                ? "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/40"
                : "hover:bg-muted/50"
            )}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {problemSet.title}
            </CardTitle>
          </CardHeader>

          {/* Collapsible content */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.section
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: contentHeight, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden", willChange: "height, opacity" }}
              >
                <div ref={contentRef}>
                  <CardContent className="p-10 space-y-10">
                    {/* Lectures */}
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">
                        Lectures
                      </h3>
                      <div className="space-y-3 text-gray-700 dark:text-gray-300 text-base">
                        {problemSet.lectures.map((lecture, index) => (
                          <LectureItem
                            key={index}
                            problemSetId={problemSet.id}
                            number={lecture.number}
                            title={lecture.title}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Topics & Readings */}
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">
                        Topics & Readings
                      </h3>
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                          <TableRow>
                            <TableHead className="w-16 text-sm uppercase text-center">
                              Ses #
                            </TableHead>
                            <TableHead className="text-sm uppercase">Topic title</TableHead>
                            <TableHead className="w-36 text-sm uppercase text-center">
                              Reading range
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {problemSet.topics.map((topic, index) => (
                            <TableRow key={index}>
                              <TableCell className="whitespace-nowrap text-base text-center">
                                {topic.session}
                              </TableCell>
                              <TableCell className="text-base font-medium">
                                {topic.title}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-base text-gray-500 dark:text-gray-400 text-center">
                                {topic.reading}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Assigned Problems */}
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="w-24" />
                        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 text-center flex-1">
                          Assigned Problems
                        </h3>
                        <div className="w-24 flex justify-end">
                          <SolutionUpload problemSetId={problemSet.id} sectionId={problemSet.id} />
                        </div>
                      </div>
                      <div className={cn("overflow-x-auto", isMobile && "-mx-10 px-10")}>
                        <Table>
                          <TableHeader className="bg-gray-50 dark:bg-gray-800">
                            <TableRow>
                              <TableHead className="w-20 text-sm uppercase text-center">
                                Section
                              </TableHead>
                              <TableHead className="text-sm uppercase">Problems</TableHead>
                              <TableHead className="w-16 text-sm uppercase text-center">
                                Page
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {problemSet.problems.map((problem, index) => (
                              <TableRow key={index}>
                                <TableCell className="whitespace-nowrap text-base text-center">
                                  {problem.section}
                                </TableCell>
                                <TableCell className="text-base">{problem.problems}</TableCell>
                                <TableCell className="whitespace-nowrap text-base text-gray-500 dark:text-gray-400 text-center">
                                  {problem.page}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <Separator className="mt-6" />
                  </CardContent>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </Card>
      </ContextMenuTrigger>

      {/* Context‑menu */}
      <ContextMenuContent className="w-auto min-w-[140px]">
        <ContextMenuItem
          onClick={() => {
            onToggleCompletion?.();
            setIsMenuOpen(false);
          }}
          className={isCompleted ? "text-green-600" : "text-muted-foreground"}
        >
          {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
