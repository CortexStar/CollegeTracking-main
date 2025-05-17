import { useState, useEffect, useCallback } from 'react';

export interface Solution {
  problemSetId: string;
  sectionId: string;
  fileName: string;
  fileUrl: string;
}

export function useSolutions() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  
  // Load solutions from localStorage on initial render
  useEffect(() => {
    const savedSolutions = localStorage.getItem('solutions');
    if (savedSolutions) {
      setSolutions(JSON.parse(savedSolutions));
    }
  }, []);
  
  // Save solutions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('solutions', JSON.stringify(solutions));
  }, [solutions]);
  
  // Add or update a solution
  const addSolution = useCallback((solution: Solution) => {
    setSolutions(prevSolutions => {
      // Check if this solution already exists (based on problemSetId and sectionId)
      const existingIndex = prevSolutions.findIndex(
        s => s.problemSetId === solution.problemSetId && s.sectionId === solution.sectionId
      );
      
      if (existingIndex >= 0) {
        // Update existing solution
        const updated = [...prevSolutions];
        updated[existingIndex] = solution;
        return updated;
      } else {
        // Add new solution
        return [...prevSolutions, solution];
      }
    });
  }, []);
  
  // Remove a solution
  const removeSolution = useCallback((problemSetId: string, sectionId: string) => {
    setSolutions(prevSolutions => 
      prevSolutions.filter(
        s => !(s.problemSetId === problemSetId && s.sectionId === sectionId)
      )
    );
  }, []);
  
  // Get a specific solution
  const getSolution = useCallback((problemSetId: string, sectionId: string) => {
    return solutions.find(
      s => s.problemSetId === problemSetId && s.sectionId === sectionId
    );
  }, [solutions]);
  
  return {
    solutions,
    addSolution,
    removeSolution,
    getSolution
  };
}