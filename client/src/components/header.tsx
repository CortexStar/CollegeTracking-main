import { Sun, Moon, Book, GraduationCap, BarChart, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useCourseName } from "@/hooks/use-course-name";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { getBooks, onBooksChange, BookMeta, deleteBook, initializeDefaultBooks } from "@/lib/bookStore";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { courseName } = useCourseName();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize the default books first
    initializeDefaultBooks();
    
    // Load books asynchronously
    const loadBooks = async () => {
      try {
        setLoading(true);
        const bookList = await getBooks();
        setBooks(bookList);
      } catch (error) {
        console.error("Failed to load books:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBooks();
    
    // Setup listener for book changes
    const unsubscribe = onBooksChange(() => {
      loadBooks();
    });
    
    return () => { unsubscribe(); };
  }, []);

  const handleDeleteBook = async (book: BookMeta) => {
    try {
      await deleteBook(book.id);
      
      // Get the current URL path
      const currentPath = window.location.pathname;
      
      // If user is viewing the deleted book, navigate away
      if (currentPath.includes(`/books/${book.id}`)) {
        navigate('/textbook');
      }
      
      toast({
        title: "Book deleted",
        description: `"${book.title}" has been removed from your library`
      });
    } catch (error) {
      console.error("Failed to delete book:", error);
      toast({
        title: "Error",
        description: "Failed to delete the book. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-slate-800 text-slate-100 dark:bg-gray-950">
      <div className="flex h-full items-center gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-wide text-mit-red dark:text-mit-red-dark">
          COURSE CHARTS
        </Link>

        {/* Main nav - visible on md screens and up */}
        <nav className="hidden md:flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="header" size="sm" className="flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-accent/20 hover:text-accent-foreground">
                <GraduationCap className="h-4 w-4" />
                Classes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/course" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {courseName}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/textbook" className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  Textbook
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/grades" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Grades
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/exams" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exams
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="relative">
            {/* Regular dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="header" 
                  size="sm" 
                  className="flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-accent/20 hover:text-accent-foreground"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    navigate("/books/new");
                  }}
                >
                  <Book className="h-4 w-4" />
                  Book
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading books...
                  </div>
                ) : books.length > 0 ? (
                  <>
                    {books.map(book => (
                      <ContextMenu key={book.id}>
                        <ContextMenuTrigger asChild>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/books/${book.id}`)}
                          >
                            {book.title}
                          </DropdownMenuItem>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem 
                            className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                            onClick={() => handleDeleteBook(book)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Book
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </>
                ) : (
                  <DropdownMenuItem disabled>
                    No books found
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/books/new" className="flex items-center">
                    <Book className="h-4 w-4 mr-2" />
                    Add New Book
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button asChild variant="header" size="sm" className="flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-accent/20 hover:text-accent-foreground">
            <Link href="/grades">
              <BarChart className="h-4 w-4" />
              Grades & Forecasting
            </Link>
          </Button>
          <Button asChild variant="header" size="sm" className="flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-accent/20 hover:text-accent-foreground">
            <Link href="/exams">
              <FileText className="h-4 w-4" />
              Exams
            </Link>
          </Button>
        </nav>

        {/* Right-side controls */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
