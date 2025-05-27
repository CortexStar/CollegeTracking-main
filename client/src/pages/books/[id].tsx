import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Edit2, 
  Check, 
  X, 
  ExternalLink, 
  Printer,
  ArrowLeft,
  Loader2 
} from 'lucide-react';
import { bookStore } from '@/stores/bookStore';
import { BookMeta } from '@/types/book';
import { TextbookToc } from '@/components/TextbookToc';

export default function BookViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [book, setBook] = useState<BookMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempAuthor, setTempAuthor] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadBook = async () => {
      try {
        const bookData = await bookStore.getBook(id);
        if (!bookData) {
          toast({
            title: 'Book not found',
            description: 'The requested book could not be found.',
            variant: 'destructive',
          });
          navigate('/books/library');
          return;
        }
        setBook(bookData);
      } catch (error) {
        console.error('Error loading book:', error);
        toast({
          title: 'Error loading book',
          description: 'There was an error loading the book.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadBook();

    // Listen for book changes
    const unsubscribe = bookStore.onBooksChange(() => {
      loadBook();
    });

    return unsubscribe;
  }, [id, navigate, toast]);

  const pdfUrl = useMemo(() => {
    if (!book) return null;

    // The book.url should now be directly usable if coming from the server
    // (e.g., /api/files/books/2024/05/some-uuid-file.pdf)
    if (book.url) {
      return book.url;
    }

    // Fallbacks for MemoryStorageAdapter (local data, e.g., during upload before server confirm or if server is down)
    if (book.pdfData && book.pdfData.startsWith('data:application/pdf;base64,')) {
      return book.pdfData; // Data URI
    }
    
    // If book.pdfData exists but wasn't a data URI (less common for MemoryAdapter now, but for safety)
    // This was more relevant for very old versions. Modern MemoryAdapter creates blob/data URIs.
    if (book.pdfData) { 
      // Potentially try to create a blob URL here if it's raw base64, but
      // MemoryStorageAdapter should ideally already provide a usable `url` (blob or data URI)
      // or `pdfData` as a data URI.
      console.warn("Book has pdfData but no direct url or data URI format, PDF might not display from this source.");
      return null; // Or attempt to make blob if sure it's base64
    }

    return null; // No suitable URL or data found
  }, [book]);

  const handleTitleEdit = () => {
    if (!book) return;
    setTempTitle(book.title);
    setEditingTitle(true);
  };

  const handleAuthorEdit = () => {
    if (!book) return;
    setTempAuthor(book.author || '');
    setEditingAuthor(true);
  };

  const handleTitleSave = async () => {
    if (!book || !tempTitle.trim()) return;

    try {
      await bookStore.updateBook(book.id, { title: tempTitle.trim() });
      setEditingTitle(false);
      toast({
        title: 'Title updated',
        description: 'Book title has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update book title.',
        variant: 'destructive',
      });
    }
  };

  const handleAuthorSave = async () => {
    if (!book) return;

    try {
      await bookStore.updateBook(book.id, { 
        author: tempAuthor.trim() || undefined 
      });
      setEditingAuthor(false);
      toast({
        title: 'Author updated',
        description: 'Book author has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update book author.',
        variant: 'destructive',
      });
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(false);
    setTempTitle('');
  };

  const handleAuthorCancel = () => {
    setEditingAuthor(false);
    setTempAuthor('');
  };

  const handleOpenFullPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      printWindow?.addEventListener('load', () => {
        printWindow.print();
      });
    }
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

  if (!book || !pdfUrl) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Book not available</p>
              <p className="text-muted-foreground">
                The PDF content could not be loaded.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          {/* Navigation */}
          <Button
            variant="outline"
            onClick={() => navigate('/books/library')}
            className="w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>

          {/* Book Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Title
                </label>
                {editingTitle ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave();
                        if (e.key === 'Escape') handleTitleCancel();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleTitleSave}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleTitleCancel}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 mt-1 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={handleTitleEdit}
                  >
                    <p className="flex-1 font-medium">{book.title}</p>
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Author
                </label>
                {editingAuthor ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={tempAuthor}
                      onChange={(e) => setTempAuthor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAuthorSave();
                        if (e.key === 'Escape') handleAuthorCancel();
                      }}
                      className="flex-1"
                      placeholder="Enter author name"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAuthorSave}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleAuthorCancel}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 mt-1 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={handleAuthorEdit}
                  >
                    <p className="flex-1 text-muted-foreground">
                      {book.author || 'No author specified'}
                    </p>
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleOpenFullPdf} size="sm" className="flex-1">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Full PDF
                </Button>
                <Button onClick={handlePrint} variant="outline" size="sm" className="flex-1">
                  <Printer className="h-3 w-3 mr-1" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          {pdfUrl && <TextbookToc pdfUrl={pdfUrl} />}
        </div>

        {/* PDF Viewer */}
        <div className="flex-1">
          <Card className="h-[calc(100vh-8rem)]">
            <CardContent className="p-0 h-full">
              <embed
                src={pdfUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                className="rounded-lg"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}