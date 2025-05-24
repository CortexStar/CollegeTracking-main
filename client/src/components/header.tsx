import {
  Sun,
  Moon,
  Book,
  GraduationCap,
  BarChart,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useCourseName } from "@/hooks/use-course-name";
import { Link, useLocation } from "wouter";
import { useEffect, useState, useCallback, useRef } from "react";
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
import {
  getBooks,
  onBooksChange,
  BookMeta,
  deleteBook,
  initializeDefaultBooks,
} from "@/lib/bookStore";
import { useToast } from "@/hooks/use-toast";

/**
 * Shared Tailwind classes for every navigation button.
 * Subtle scale with transform-gpu for smooth hardware acceleration
 */
const headerButtonClass =
  "flex items-center gap-1 transition-all duration-200 ease-out transform-gpu hover:scale-[1.02] hover:bg-accent/20 hover:text-accent-foreground data-[state=open]:scale-[1.02] data-[state=open]:bg-accent/20 data-[state=open]:text-accent-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none outline-none border-0 focus:border-0 will-change-transform";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { courseName } = useCourseName();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const classesDropdownRef = useRef<HTMLButtonElement>(null);
  const booksDropdownRef = useRef<HTMLButtonElement>(null);

  /* ---------------------------- data loading ---------------------------- */
  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const bookList = await getBooks();
      setBooks(bookList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeDefaultBooks();
    loadBooks();
    const unsubscribe = onBooksChange(loadBooks);
    return () => {
      unsubscribe();
    };
  }, [loadBooks]);

  /* ---------------------------- ui handlers ---------------------------- */
  const handleDeleteBook = async (book: BookMeta) => {
    try {
      await deleteBook(book.id);

      // If the deleted book is currently open, redirect
      if (window.location.pathname.includes(`/books/${book.id}`)) {
        navigate("/textbook");
      }

      toast({
        title: "Book deleted",
        description: `"${book.title}" has been removed from your library.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete the book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Handle dropdown close to prevent focus flash
  const handleDropdownOpenChange = (open: boolean, buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (!open && buttonRef.current) {
      // When dropdown closes, blur the button to prevent focus flash
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        buttonRef.current?.blur();
      });
    }
  };

  /* --------------------------------------------------------------------- */
  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-slate-800 text-slate-100 dark:bg-gray-950">
      <div className="flex h-full items-center gap-4 px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-wide text-mit-red dark:text-mit-red-dark"
        >
          COURSE CHARTS
        </Link>

        {/* ----------- main nav (md+) ----------- */}
        <nav className="hidden gap-2 md:flex">
          {/* Classes */}
          <DropdownMenu onOpenChange={(open) => handleDropdownOpenChange(open, classesDropdownRef)}>
            <DropdownMenuTrigger asChild>
              <Button 
                ref={classesDropdownRef}
                variant="header" 
                size="sm" 
                className={headerButtonClass}
                onBlur={(e) => {
                  // Prevent focus flash on blur - no style manipulation needed
                  e.preventDefault();
                }}
              >
                <GraduationCap className="h-4 w-4" />
                Classes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 focus:outline-none ring-0">
              <DropdownMenuItem asChild>
                <Link href="/course" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {courseName}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Books */}
          <DropdownMenu onOpenChange={(open) => handleDropdownOpenChange(open, booksDropdownRef)}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={booksDropdownRef}
                variant="header"
                size="sm"
                className={headerButtonClass}
                onContextMenu={(e) => {
                  e.preventDefault();
                  navigate("/books/new");
                }}
                onBlur={(e) => {
                  // Prevent focus flash on blur - no style manipulation needed
                  e.preventDefault();
                }}
              >
                <Book className="h-4 w-4" />
                Book
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 focus:outline-none ring-0">
              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading books...
                </div>
              ) : books.length ? (
                <>
                  {books.map((book) => (
                    <ContextMenu key={book.id}>
                      <ContextMenuTrigger asChild>
                        <DropdownMenuItem onClick={() => navigate(`/books/${book.id}`)}>
                          {book.title}
                        </DropdownMenuItem>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          className="text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950"
                          onClick={() => handleDeleteBook(book)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Book
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </>
              ) : (
                <DropdownMenuItem disabled>No books found</DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/books/new" className="flex items-center">
                  <Book className="mr-2 h-4 w-4" />
                  Add New Book
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Grades & Exams */}
          <HeaderNavLink href="/grades" icon={BarChart}>
            Grades & Forecasting
          </HeaderNavLink>
          <HeaderNavLink href="/exams" icon={FileText}>
            Exams
          </HeaderNavLink>
        </nav>

        {/* ----------- right controls ----------- */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ----------------------- Helper components ----------------------- */
interface HeaderNavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function HeaderNavLink({ href, icon: Icon, children }: HeaderNavLinkProps) {
  return (
    <Button asChild variant="header" size="sm" className={headerButtonClass}>
      <Link href={href} className="flex items-center gap-1">
        <Icon className="h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}