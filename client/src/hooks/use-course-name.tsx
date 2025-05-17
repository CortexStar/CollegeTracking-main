import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type CourseNameContextType = {
  courseName: string;
  setCourseName: (name: string) => void;
};

const CourseNameContext = createContext<CourseNameContextType | undefined>(undefined);

export function CourseNameProvider({ children }: { children: ReactNode }) {
  // We'll use localStorage to persist the course name
  const [courseName, setCourseName] = useState<string>(
    localStorage.getItem('courseName') || 'Introduction to Linear Algebra'
  );

  // Update localStorage when course name changes
  useEffect(() => {
    localStorage.setItem('courseName', courseName);
  }, [courseName]);

  return (
    <CourseNameContext.Provider value={{ courseName, setCourseName }}>
      {children}
    </CourseNameContext.Provider>
  );
}

export function useCourseName() {
  const context = useContext(CourseNameContext);
  if (context === undefined) {
    throw new Error('useCourseName must be used within a CourseNameProvider');
  }
  return context;
}