import { createContext, ReactNode, useContext } from 'react';
import { useSolutions, Solution } from '@/hooks/use-solutions';

interface SolutionsContextType {
  solutions: Solution[];
  addSolution: (solution: Solution) => void;
  removeSolution: (problemSetId: string, sectionId: string) => void;
  getSolution: (problemSetId: string, sectionId: string) => Solution | undefined;
}

const SolutionsContext = createContext<SolutionsContextType | undefined>(undefined);

export function SolutionsProvider({ children }: { children: ReactNode }) {
  const solutionsData = useSolutions();
  
  return (
    <SolutionsContext.Provider value={solutionsData}>
      {children}
    </SolutionsContext.Provider>
  );
}

export function useSolutionsContext() {
  const context = useContext(SolutionsContext);
  if (context === undefined) {
    throw new Error('useSolutionsContext must be used within a SolutionsProvider');
  }
  return context;
}