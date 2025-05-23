import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { getBook, updateBook, onBooksChange } from "@/lib/bookStore";
import { Input } from "@/components/ui/input";
import TextbookToc from "@/components/textbook-toc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Printer, Loader2 } from "lucide-react";

export default function BookPage() {
  const params = useParams();
  const id = params.id;
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState<{field: "title" | "author" | null}>({field: null});
  const { toast } = useToast();
  
  // Store the PDF URL
  const pdfUrl = useMemo(() => {
    // If the book was just uploaded and has pdfData, use that
    if (book?.pdfData) {
      return book.pdfData;
    }
    // Otherwise use the URL from the server
    return book?.url || '';
  }, [book]);

  // Fetch book data when the component mounts or the ID changes
  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      try {
        const bookData = await getBook(id);
        setBook(bookData);
        if (!bookData) {
          toast({
            title: "Book not found",
            description: "The book you're looking for doesn't exist",
            variant: "destructive"
          });
          navigate("/textbook");
        }
      } catch (error) {
        console.error("Error fetching book:", error);
        toast({
          title: "Error loading book",
          description: "There was a problem loading the book. Please try again.",
          variant: "destructive"
        });
        navigate("/textbook");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookData();
    
    // Add listener for book changes
    const unsubscribe = onBooksChange(() => {
      // If books change (e.g., a book is deleted), check if current book still exists
      fetchBookData();
    });
    
    return () => unsubscribe();
  }, [id, navigate, toast]);

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex-grow flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading book...</p>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold">Book not found</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            The book you're looking for doesn't exist
          </p>
          <Button className="mt-6" onClick={() => navigate("/books/new")}>
            Add a New Book
          </Button>
        </div>
      </div>
    );
  }

  // Handle metadata updates
  async function commit(field: "title" | "author", value: string) {
    try {
      await updateBook(book.id, { [field]: value });
      setEditing({field: null});
      // Update local state
      setBook({...book, [field]: value});
      
      toast({
        title: `${field.charAt(0).toUpperCase() + field.slice(1)} updated`,
        description: `The ${field} has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: `Failed to update the ${field}. Please try again.`,
        variant: "destructive"
      });
      console.error(`Error updating ${field}:`, error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 flex-grow">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-0">
          <div className="max-w-3xl">
            {editing.field === "title" ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input) commit("title", input.value);
              }}>
                <Input
                  autoFocus 
                  defaultValue={book.title}
                  onBlur={(e) => commit("title", e.target.value)}
                  className="text-4xl font-bold mb-1 h-auto text-left text-gray-900 dark:text-gray-100"
                />
              </form>
            ) : (
              <h1
                className="text-4xl font-bold cursor-pointer hover:underline hover:underline-offset-4 text-gray-900 dark:text-gray-100"
                onDoubleClick={() => setEditing({field: "title"})}
              >
                {book.title}
              </h1>
            )}

            {editing.field === "author" ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input) commit("author", input.value);
              }}>
                <Input
                  autoFocus 
                  defaultValue={book.author}
                  onBlur={(e) => commit("author", e.target.value)}
                  className="text-lg text-left text-gray-600 dark:text-gray-400"
                />
              </form>
            ) : (
              <p
                className="text-lg text-gray-600 dark:text-gray-400 cursor-pointer hover:underline hover:underline-offset-4 mt-1"
                onDoubleClick={() => setEditing({field: "author"})}
              >
                {book.author || "(Double-click to add author)"}
              </p>
            )}
          </div>

          <div>
            <TextbookToc pdfUrl={pdfUrl} />
          </div>
        </div>

        {/* PDF Viewer */}
        <Card>
          <CardContent className="p-0 rounded-lg overflow-hidden">
            <div className="flex flex-col items-center justify-center p-0 bg-white dark:bg-gray-800 min-h-[800px] overflow-auto">
              {/* PDF Header */}
              <div className="w-full border-b border-gray-200 dark:border-gray-800 py-2 px-4 flex justify-end items-center gap-4 bg-gray-50 dark:bg-gray-900">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-gray-50 border-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-900 dark:hover:bg-gray-800"
                  onClick={() => window.open(pdfUrl, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  Full PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-gray-50 border-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-900 dark:hover:bg-gray-800"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
              <div className="w-full">
                <embed 
                  src={pdfUrl} 
                  type="application/pdf" 
                  width="100%" 
                  height="1200px"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}