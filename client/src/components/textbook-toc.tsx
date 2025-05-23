import { Fragment, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Chapter {
  id: number;
  title: string;
  sections: {
    id: string;
    title: string;
    page: number;
  }[];
}

// Using the table of contents from the textbook
const tableOfContents: Chapter[] = [
  {
    id: 1,
    title: "Introduction to Vectors",
    sections: [
      { id: "1.1", title: "Vectors and Linear Combinations", page: 2 },
      { id: "1.2", title: "Lengths and Dot Products", page: 11 },
      { id: "1.3", title: "Matrices", page: 22 }
    ]
  },
  {
    id: 2,
    title: "Solving Linear Equations",
    sections: [
      { id: "2.1", title: "Vectors and Linear Equations", page: 31 },
      { id: "2.2", title: "The Idea of Elimination", page: 45 },
      { id: "2.3", title: "Elimination Using Matrices", page: 57 },
      { id: "2.4", title: "Rules for Matrix Operations", page: 68 },
      { id: "2.5", title: "Inverse Matrices", page: 82 },
      { id: "2.6", title: "Elimination = Factorization: A = L U", page: 96 },
      { id: "2.7", title: "Transposes and Permutations", page: 108 }
    ]
  },
  {
    id: 3,
    title: "Vector Spaces and Subspaces",
    sections: [
      { id: "3.1", title: "Spaces of Vectors", page: 121 },
      { id: "3.2", title: "The Nullspace of A: Solving Ax = 0", page: 133 },
      { id: "3.3", title: "The Rank and the Row Reduced Form", page: 145 },
      { id: "3.4", title: "The Complete Solution to Ax = b", page: 156 },
      { id: "3.5", title: "Independence, Basis and Dimension", page: 169 },
      { id: "3.6", title: "Dimensions of the Four Subspaces", page: 185 }
    ]
  },
  {
    id: 4,
    title: "Orthogonality",
    sections: [
      { id: "4.1", title: "Orthogonality of the Four Subspaces", page: 196 },
      { id: "4.2", title: "Projections", page: 207 },
      { id: "4.3", title: "Least Squares Approximations", page: 219 },
      { id: "4.4", title: "Orthogonal Bases and Gram-Schmidt", page: 231 }
    ]
  },
  {
    id: 5,
    title: "Determinants",
    sections: [
      { id: "5.1", title: "The Properties of Determinants", page: 245 },
      { id: "5.2", title: "Permutations and Cofactors", page: 256 },
      { id: "5.3", title: "Cramer's Rule, Inverses, and Volumes", page: 270 }
    ]
  },
  {
    id: 6,
    title: "Eigenvalues and Eigenvectors",
    sections: [
      { id: "6.1", title: "Introduction to Eigenvalues", page: 284 },
      { id: "6.2", title: "Diagonalizing a Matrix", page: 299 },
      { id: "6.3", title: "Applications to Differential Equations", page: 313 },
      { id: "6.4", title: "Symmetric Matrices", page: 331 },
      { id: "6.5", title: "Positive Definite Matrices", page: 343 },
      { id: "6.6", title: "Similar Matrices", page: 356 },
      { id: "6.7", title: "Singular Value Decomposition (SVD)", page: 364 }
    ]
  },
  {
    id: 7,
    title: "Linear Transformations",
    sections: [
      { id: "7.1", title: "The Idea of a Linear Transformation", page: 376 },
      { id: "7.2", title: "The Matrix of a Linear Transformation", page: 385 },
      { id: "7.3", title: "Diagonalization and the Pseudoinverse", page: 400 }
    ]
  },
  {
    id: 8,
    title: "Applications",
    sections: [
      { id: "8.1", title: "Matrices in Engineering", page: 410 },
      { id: "8.2", title: "Graphs and Networks", page: 421 },
      { id: "8.3", title: "Markov Matrices, Population, and Economics", page: 432 },
      { id: "8.4", title: "Linear Programming", page: 441 },
      { id: "8.5", title: "Fourier Series: Linear Algebra for Functions", page: 448 },
      { id: "8.6", title: "Linear Algebra for Statistics and Probability", page: 454 },
      { id: "8.7", title: "Computer Graphics", page: 460 }
    ]
  },
  {
    id: 9,
    title: "Numerical Linear Algebra",
    sections: [
      { id: "9.1", title: "Gaussian Elimination in Practice", page: 466 },
      { id: "9.2", title: "Norms and Condition Numbers", page: 476 },
      { id: "9.3", title: "Iterative Methods and Preconditioners", page: 482 }
    ]
  },
  {
    id: 10,
    title: "Complex Vectors and Matrices",
    sections: [
      { id: "10.1", title: "Complex Numbers", page: 494 },
      { id: "10.2", title: "Hermitian and Unitary Matrices", page: 502 },
      { id: "10.3", title: "The Fast Fourier Transform", page: 510 }
    ]
  }
];

interface TextbookTocProps {
  onSelectPage?: (page: number) => void;
  pdfUrl?: string;
}

export default function TextbookToc({ onSelectPage, pdfUrl }: TextbookTocProps) {
  const [open, setOpen] = useState(false);
  
  // Determine if we should show the standard TOC (only for the main textbook)
  const isMainTextbook = !pdfUrl || pdfUrl === '/linear-algebra-book.pdf';
  
  const handleSelectSection = (page: number) => {
    // Adjust page number to account for the difference between textbook page numbers and PDF page numbers
    // Add 10 to every page number except for page 2 (section 1.1) which is correct
    const adjustedPage = page === 2 ? page : page + 10;
    
    // Only call if function is provided
    if (typeof onSelectPage === 'function') {
      onSelectPage(adjustedPage);
    }
    setOpen(false);
    
    // Open the PDF at that page in a new tab as a fallback
    // Note: This is a limited solution as most PDF viewers don't support page parameters in URLs
    const pdfToOpen = pdfUrl || '/linear-algebra-book.pdf';
    window.open(`${pdfToOpen}#page=${adjustedPage}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Book className="h-4 w-4" />
          Table of Contents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Table of Contents</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isMainTextbook ? (
            <Accordion type="multiple" className="w-full">
              {tableOfContents.map((chapter) => (
                <AccordionItem key={chapter.id} value={`chapter-${chapter.id}`}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    {chapter.id}. {chapter.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {chapter.sections.map((section) => (
                        <div 
                          key={section.id} 
                          className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2"
                          onClick={() => handleSelectSection(section.page)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{section.id}</span>
                            <span>{section.title}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span>p. {section.page}</span>
                            <span className="text-xs opacity-70">(PDF: {section.page === 2 ? 2 : section.page + 10})</span>
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-6 flex justify-center">
                <Book className="h-16 w-16 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Table of Contents Not Available</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Detailed table of contents is not available for this uploaded book. 
                You can still navigate through the PDF using the scroll controls.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}