import { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import { initializeDefaultBooks, getBooks, BookMeta } from "@/lib/bookStore";
import { Loader2 } from "lucide-react";

export default function TextbookPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  
  // Initialize default books and redirect to the unified book system
  useEffect(() => {
    // Initialize the default books to ensure they exist
    initializeDefaultBooks();
    
    const redirectToBook = async () => {
      try {
        // Get all books including the default
        const books = await getBooks();
        
        // Find the default book (or first available book)
        const defaultBook = books.find(book => book.id === "linear-algebra-default") || books[0];
        
        if (defaultBook) {
          navigate(`/books/${defaultBook.id}`);
        } else {
          // If no books are found, redirect to the add book page
          setLoading(false);
          setTimeout(() => {
            navigate("/books/new");
          }, 1000);
        }
      } catch (error) {
        console.error("Error loading books:", error);
        setLoading(false);
        setTimeout(() => {
          navigate("/books/new");
        }, 1000);
      }
    };
    
    redirectToBook();
  }, [navigate]);
  
  return (
    <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {loading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
            <p className="mt-4">Loading textbooks...</p>
          </>
        ) : (
          <>
            <p>No textbooks found. Redirecting to add a new book...</p>
          </>
        )}
      </div>
    </div>
  );
}