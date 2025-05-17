import { useState, useEffect } from "react";

// Hook to manage unit completion status
export function useProgress() {
  const [completedUnits, setCompletedUnits] = useState<Record<string, boolean>>({});
  
  // Load completion data from localStorage on initial render
  useEffect(() => {
    const savedProgress = localStorage.getItem("unit-progress");
    if (savedProgress) {
      try {
        setCompletedUnits(JSON.parse(savedProgress));
      } catch (error) {
        console.error("Failed to parse saved progress:", error);
      }
    }
  }, []);
  
  // Save to localStorage whenever completedUnits changes
  useEffect(() => {
    localStorage.setItem("unit-progress", JSON.stringify(completedUnits));
  }, [completedUnits]);
  
  // Toggle completion status of a unit
  const toggleUnitCompletion = (unitId: string) => {
    setCompletedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };
  
  // Check if a unit is completed
  const isUnitCompleted = (unitId: string): boolean => {
    return !!completedUnits[unitId];
  };
  
  // Calculate overall progress percentage
  const calculateProgress = (totalUnits: number): number => {
    if (totalUnits === 0) return 0;
    const completedCount = Object.values(completedUnits).filter(Boolean).length;
    return Math.round((completedCount / totalUnits) * 100);
  };
  
  return {
    completedUnits,
    toggleUnitCompletion,
    isUnitCompleted,
    calculateProgress
  };
}