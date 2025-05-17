import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { problemSets } from "@/data/problem-sets";

interface SidebarProps {
  activeProblemSet: string | null;
  setActiveProblemSet: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ 
  activeProblemSet, 
  setActiveProblemSet,
  isOpen,
  setIsOpen
}: SidebarProps) {
  const [, setLocation] = useLocation();

  const handleProblemSetClick = (id: string) => {
    setActiveProblemSet(id);
    setLocation(`/#${id}`, { replace: true });
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "w-64 lg:w-72 flex-shrink-0 md:sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto pb-8",
          "fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 md:bg-transparent md:dark:bg-transparent p-4 md:p-0 transition-transform duration-200 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center mb-4 md:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Problem Sets
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-full">
          <nav className="space-y-1">
            <h2 className="text-lg font-semibold mb-4 hidden md:block text-gray-900 dark:text-gray-100">
              Problem Sets
            </h2>
            <ul className="space-y-2">
              {problemSets.map((problemSet) => (
                <li key={problemSet.id}>
                  <button
                    onClick={() => handleProblemSetClick(problemSet.id)}
                    className={cn(
                      "block w-full px-3 py-2 rounded-md text-sm font-medium text-left",
                      activeProblemSet === problemSet.id
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    {problemSet.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
