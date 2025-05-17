import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronUp } from "lucide-react";
import ProblemSet from "@/components/problem-set";
import { ProgressCircle } from "@/components/progress-circle";
import CourseNameDisplay from "@/components/course-name-display";
import { useProgress } from "@/hooks/use-progress";
import { problemSets } from "@/data/problem-sets";

export default function Home() {
  const [location] = useLocation();
  const hash = location.includes("#") ? location.split("#")[1] : null;
  const [activeProblemSet, setActiveProblemSet] = useState<string | null>(
    hash || "problem-set-1"
  );
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const { toggleUnitCompletion, isUnitCompleted, calculateProgress } = useProgress();

  // Update active problem set when URL hash changes
  useEffect(() => {
    if (hash) {
      setActiveProblemSet(hash);
      // Scroll to the element
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  // Show scroll to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex flex-row items-start justify-between">
            <div className="text-left">
              <CourseNameDisplay />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Course Structure Guide for "Linear Algebra - MIT"
              </p>
            </div>
            <div className="flex flex-col items-center">
              <ProgressCircle 
                progress={calculateProgress(problemSets.length)} 
                size="md"
                className="mb-2"
              />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Course Progress
              </p>
            </div>
          </div>
          
          {problemSets.map((problemSet) => (
            <ProblemSet 
              key={problemSet.id}
              problemSet={problemSet}
              isActive={activeProblemSet === problemSet.id}
              isCompleted={isUnitCompleted(problemSet.id)}
              onToggleCompletion={() => toggleUnitCompletion(problemSet.id)}
            />
          ))}
        </div>
      </div>

      {showScrollToTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-300"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
