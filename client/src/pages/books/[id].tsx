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
  Loader2,
  Link,
  Copy,
  Save,
  List
} from 'lucide-react';
import { bookStore } from '@/stores/bookStore';
import { BookMeta } from '@/types/book';
import { TextbookToc } from '@/components/TextbookToc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BookViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [book, setBook] = useState<BookMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempAuthor, setTempAuthor] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadBook = async () => {
      try {
        // Force fresh fetch by bypassing cache temporarily
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

  useEffect(() => {
    if (book && book.externalLink) {
      setCurrentLink(book.externalLink);
    } else {
      setCurrentLink('');
    }
  }, [book, isLinkDialogOpen]);

  const pdfUrl = useMemo(() => {
    if (!book) return null;

    // Reset error when we have a new book
    setPdfError(null);

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
      setPdfError("PDF format is not supported for viewing. The file might be corrupted or in an unsupported format.");
      return null; // Or attempt to make blob if sure it's base64
    }

    setPdfError("PDF file is not available. The file might have been moved or deleted.");
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
      const updatedBook = await bookStore.updateBook(book.id, { title: tempTitle.trim() });
      // Update local book state with the returned data
      setBook(updatedBook);
      setEditingTitle(false);
      /* toast({
        title: 'Title updated',
        description: 'Book title has been updated successfully.',
      }); */
    } catch (error) {
      console.error('Error updating book title:', error);
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
      const updatedBook = await bookStore.updateBook(book.id, { 
        author: tempAuthor.trim() || undefined 
      });
      // Update local book state with the returned data
      setBook(updatedBook);
      setEditingAuthor(false);
      /* toast({
        title: 'Author updated',
        description: 'Book author has been updated successfully.',
      }); */
    } catch (error) {
      console.error('Error updating book author:', error);
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

  const handleSaveLink = async () => {
    if (!book) return;
    try {
      const updatedBook = await bookStore.updateBook(book.id, { externalLink: currentLink });
      // Update local book state with the returned data
      setBook(updatedBook);
      /* toast({
        title: 'Link saved',
        description: 'The external link has been updated.',
      }); */
      setIsLinkDialogOpen(false);
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save the external link.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = () => {
    if (!currentLink) {
      toast({
        title: 'Nothing to copy',
        description: 'The link is empty.',
        variant: 'destructive',
      });
      return;
    }
    navigator.clipboard.writeText(currentLink)
      .then(() => {
        /* toast({ title: 'Copied!', description: 'Link copied to clipboard.' }); */
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        toast({ title: 'Copy failed', description: 'Could not copy link to clipboard.', variant: 'destructive' });
      });
  };

  const handleOpenFullPdf = () => {
    if (book?.externalLink) {
      window.open(book.externalLink, '_blank');
    } else if (pdfUrl) {
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

  const handlePdfError = () => {
    setPdfError("Unable to load PDF. The file might be corrupted, moved, or the server might be unavailable.");
  };

  const handlePdfLoad = () => {
    setPdfError(null);
  };

  // Add timeout for PDF loading
  useEffect(() => {
    if (pdfUrl && !pdfError) {
      const timeout = setTimeout(() => {
        setPdfError("PDF is taking too long to load. Please check your internet connection and try again.");
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Book not found</p>
              <p className="text-muted-foreground">
                The requested book could not be found.
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
            variant="ghost" 
            size="sm" 
            className="h-8 px-0 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => navigate('/books/library')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>

          {/* Book Details Card */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Book Details</h2>
              </div>

              {/* Book Info */}
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </label>
                  {editingTitle ? (
                    <Input
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave();
                        if (e.key === 'Escape') handleTitleCancel();
                      }}
                      onBlur={handleTitleSave}
                      className="text-sm font-medium bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2"
                      placeholder="Enter book title"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="group flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={handleTitleEdit}
                    >
                      <span className="text-sm font-medium text-gray-900">{book.title}</span>
                      <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </label>
                  {editingAuthor ? (
                    <Input
                      value={tempAuthor}
                      onChange={(e) => setTempAuthor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAuthorSave();
                        if (e.key === 'Escape') handleAuthorCancel();
                      }}
                      onBlur={handleAuthorSave}
                      className="text-sm font-medium bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2"
                      placeholder="Enter author name"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="group flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={handleAuthorEdit}
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {book.author || 'No author specified'}
                      </span>
                      <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100"></div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  onClick={handleOpenFullPdf}
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start h-9 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 mr-3" />
                  Open Full PDF
                </Button>
                
                <Button 
                  onClick={handlePrint}
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start h-9 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4 mr-3" />
                  Print Document
                </Button>

                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-9 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <Link className="h-4 w-4 mr-3" />
                      External Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold">External Link</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="relative">
                        <Input
                          value={currentLink}
                          onChange={(e) => setCurrentLink(e.target.value)}
                          placeholder="https://example.com"
                          className="pr-10 bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={handleCopyLink}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsLinkDialogOpen(false)}
                        className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveLink} 
                        className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <TextbookToc pdfUrl={pdfUrl} />
        </div>

        {/* PDF Viewer */}
        <div className="lg:flex-1">
          <Card className="h-[calc(100vh-8rem)]">
            <CardContent className="p-0 h-full">
              {pdfError ? (
                <div className="flex items-center justify-center h-full bg-muted/10">
                  <div className="text-center p-8">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">PDF Loading Error</h3>
                    <p className="text-muted-foreground mb-4">{pdfError}</p>
                    {book?.url && (
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setPdfError(null);
                            // Force reload by modifying the URL slightly
                            if (book?.url) {
                              const embed = document.querySelector(`embed[src*="${book.url}"]`) as HTMLEmbedElement;
                              if (embed) {
                                embed.src = book.url + (book.url.includes('?') ? '&' : '?') + 'reload=' + Date.now();
                              }
                            }
                          }}
                        >
                          Retry Loading
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          You can also try opening the file directly:
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => book?.externalLink ? window.open(book.externalLink, '_blank') : book?.url && window.open(book.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : pdfUrl ? (
                <embed
                  src={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="rounded-lg"
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/10">
                  <div className="text-center p-8">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No PDF Available</h3>
                    <p className="text-muted-foreground">
                      This book doesn't have an associated PDF file.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}