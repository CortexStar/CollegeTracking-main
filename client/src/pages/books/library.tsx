import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Library, 
  Plus, 
  Search, 
  BookOpen, 
  Trash2,
  Edit,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import { bookStore } from '@/stores/bookStore';
import { BookMeta } from '@/types/book';

export default function LibraryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadBooks = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Loading books...');
        const bookList = await bookStore.getBooks();
        console.log(`Loaded ${bookList.length} books:`, bookList.map(b => ({ id: b.id, title: b.title })));
        
        if (isMounted) {
          setBooks(bookList);
        }
        
        // Add debugging information
        const status = await bookStore.checkServerStatus();
        console.log('BookStore status:', status);
        
      } catch (error) {
        console.error('Error loading books:', error);
        if (isMounted) {
          toast({
            title: 'Error loading library',
            description: 'There was an error loading your books.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBooks();

    // Listen for book changes
    const unsubscribe = bookStore.onBooksChange(() => {
      if (isMounted) {
        loadBooks();
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [toast]);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenPdf = (book: BookMeta) => {
    if (book.externalLink) {
      window.open(book.externalLink, '_blank');
    } else if (book.url) {
      window.open(book.url, '_blank');
    } else {
      toast({
        title: 'Error opening PDF',
        description: 'The PDF URL is not available for this book.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (deletingId) {
      // Prevent multiple simultaneous deletions
      return;
    }
    
    setDeletingId(id);
    try {
      await bookStore.deleteBook(id);
      toast({
        title: 'Book deleted',
        description: `"${title}" has been removed from your library.`,
      });
      
      // Optimistically update local state to prevent UI glitches
      setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
      
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'There was an error deleting the book.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Library className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">My Library</h1>
            <p className="text-muted-foreground">
              {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/books/new')} variant="ghost" className="shrink-0">
          {/* <Plus className="h-4 w-4 mr-2" /> */}
          Add New Book
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            {searchTerm ? (
              <>
                <p className="text-lg font-medium">No books found</p>
                <p className="text-muted-foreground">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">Your library is empty</p>
                <p className="text-muted-foreground mb-4">
                  Start building your collection by adding your first book
                </p>
                <Button onClick={() => navigate('/books/new')} variant="ghost">
                  {/* <Plus className="h-4 w-4 mr-2" /> */}
                  Add Your First Book
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card 
              key={book.id} 
              className="group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {book.title}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPdf(book);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-transparent hover:bg-muted/50"
                      title="Open PDF"
                    >
                      <BookOpen className="h-3 w-3" />
                    </Button>
                    {!book.isBuiltIn && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBook(book.id, book.title);
                        }}
                        disabled={deletingId === book.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        {deletingId === book.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {book.isBuiltIn && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    Built-in
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 