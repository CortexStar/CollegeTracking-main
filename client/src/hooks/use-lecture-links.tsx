import { useState, useEffect, useCallback } from 'react';

export interface LectureLink {
  problemSetId: string;
  lectureNumber: string;
  url: string;
}

export function useLectureLinks() {
  const [lectureLinks, setLectureLinks] = useState<LectureLink[]>([]);
  
  // Load lecture links from localStorage on initial render
  useEffect(() => {
    const savedLinks = localStorage.getItem('lectureLinks');
    if (savedLinks) {
      setLectureLinks(JSON.parse(savedLinks));
    }
  }, []);
  
  // Save lecture links to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lectureLinks', JSON.stringify(lectureLinks));
  }, [lectureLinks]);
  
  // Add or update a lecture link
  const addLectureLink = useCallback((link: LectureLink) => {
    setLectureLinks(prevLinks => {
      // Check if this link already exists (based on problemSetId and lectureNumber)
      const existingIndex = prevLinks.findIndex(
        l => l.problemSetId === link.problemSetId && l.lectureNumber === link.lectureNumber
      );
      
      if (existingIndex >= 0) {
        // Update existing link
        const updated = [...prevLinks];
        updated[existingIndex] = link;
        return updated;
      } else {
        // Add new link
        return [...prevLinks, link];
      }
    });
  }, []);
  
  // Remove a lecture link
  const removeLectureLink = useCallback((problemSetId: string, lectureNumber: string) => {
    setLectureLinks(prevLinks => 
      prevLinks.filter(
        l => !(l.problemSetId === problemSetId && l.lectureNumber === lectureNumber)
      )
    );
  }, []);
  
  // Get a specific lecture link
  const getLectureLink = useCallback((problemSetId: string, lectureNumber: string) => {
    return lectureLinks.find(
      l => l.problemSetId === problemSetId && l.lectureNumber === lectureNumber
    );
  }, [lectureLinks]);
  
  return {
    lectureLinks,
    addLectureLink,
    removeLectureLink,
    getLectureLink
  };
}