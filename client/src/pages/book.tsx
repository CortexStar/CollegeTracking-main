import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getBooks } from "@/lib/bookStore";
import { Loader2 } from "lucide-react";

export default function BookDefault() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const books = await getBooks();
        // Redirect to either the first book, new book page, or default textbook
        if (books.length) {
          navigate(`/books/${books[0].id}`);
        } else {
          navigate("/textbook");
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        setLoading(false);
        // If there's an error, redirect to the textbook page which handles fallbacks
        setTimeout(() => {
          navigate("/textbook");
        }, 1000);
      }
    };
    
    fetchBooks();
  }, [navigate]);
  
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
      {loading ? (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
          <p className="mt-4">Loading books...</p>
        </div>
      ) : (
        <div className="text-center">
          <p>Having trouble loading books. Redirecting...</p>
        </div>
      )}
    </div>
  );
}