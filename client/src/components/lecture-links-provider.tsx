import { createContext, ReactNode, useContext } from 'react';
import { useLectureLinks, LectureLink } from '@/hooks/use-lecture-links';

interface LectureLinksContextType {
  lectureLinks: LectureLink[];
  addLectureLink: (link: LectureLink) => void;
  removeLectureLink: (problemSetId: string, lectureNumber: string) => void;
  getLectureLink: (problemSetId: string, lectureNumber: string) => LectureLink | undefined;
}

const LectureLinksContext = createContext<LectureLinksContextType | undefined>(undefined);

export function LectureLinksProvider({ children }: { children: ReactNode }) {
  const lectureLinksData = useLectureLinks();
  
  return (
    <LectureLinksContext.Provider value={lectureLinksData}>
      {children}
    </LectureLinksContext.Provider>
  );
}

export function useLectureLinksContext() {
  const context = useContext(LectureLinksContext);
  if (context === undefined) {
    throw new Error('useLectureLinksContext must be used within a LectureLinksProvider');
  }
  return context;
}