import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Library } from 'lucide-react';
import { bookStore } from '@/stores/bookStore';
import { BookMeta } from '@/types/book';
import { headerButtonClass } from './header';

export function BookDropdown() {
  const [, navigate] = useLocation();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const bookList = await bookStore.getBooks();
        setBooks(bookList.slice(0, 10)); // Limit to 10 most recent books
      } catch (error) {
        console.error('Error loading books for dropdown:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();

    // Listen for book changes
    const unsubscribe = bookStore.onBooksChange(loadBooks);
    return unsubscribe;
  }, []);

  const handleBookSelect = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleAddNew = () => {
    navigate('/books/new');
  };

  const handleLibrary = () => {
    navigate('/books/library');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="header" size="sm" className={headerButtonClass}>
          <BookOpen className="h-4 w-4" />
          Books
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {loading ? (
          <DropdownMenuItem disabled>
            Loading books...
          </DropdownMenuItem>
        ) : books.length > 0 ? (
          <>
            {books.map((book) => (
              <DropdownMenuItem
                key={book.id}
                onClick={() => handleBookSelect(book.id)}
                className="flex flex-col items-start gap-1 py-3"
              >
                <div className="font-medium truncate w-full">
                  {book.title}
                </div>
                {book.author && (
                  <div className="text-xs text-muted-foreground truncate w-full">
                    by {book.author}
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <>
            <DropdownMenuItem disabled>
              No books available
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Book
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleLibrary}>
          <Library className="h-4 w-4 mr-2" />
          Library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 