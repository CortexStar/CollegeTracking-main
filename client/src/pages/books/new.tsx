import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { bookStore } from '@/stores/bookStore';

export default function NewBookPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const extractTitleFromFilename = useCallback((filename: string): string => {
    return filename
      .replace('.pdf', '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: 'File too large',
        description: 'Please select a PDF file smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }

    setPdfFile(file);
    if (!title.trim()) {
      setTitle(extractTitleFromFilename(file.name));
    }
  }, [title, extractTitleFromFilename, toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setPdfFile(null);
    if (title && pdfFile) {
      // Only clear title if it was auto-generated from filename
      const autoTitle = extractTitleFromFilename(pdfFile.name);
      if (title === autoTitle) {
        setTitle('');
      }
    }
  }, [title, pdfFile, extractTitleFromFilename]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfFile || !title.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide a PDF file and title.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedBook = await bookStore.uploadPdfFile(pdfFile, {
        title: title.trim(),
        author: author.trim() || undefined
      });

      toast({
        title: 'Book added successfully',
        description: `"${title.trim()}" has been added to your library.`,
      });

      navigate(`/books/${uploadedBook.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload book. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Add New Book</h1>
            <p className="text-sm text-gray-600">Upload a PDF and add it to your library</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Area */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                PDF File
              </label>
              
              {pdfFile ? (
                <div className="group relative bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(pdfFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`relative border-2 rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
                    dragActive
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <div className="space-y-4">
                    <Upload className="h-10 w-10 mx-auto text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        Drop your PDF here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        Maximum file size: 50MB
                      </p>
                    </div>
                  </div>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="sr-only"
                  />
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  disabled={isUploading}
                  className="bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2 text-sm font-medium placeholder:text-gray-400"
                  required
                />
              </div>
              
              {/* Author */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name (optional)"
                  disabled={isUploading}
                  className="bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2 text-sm font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/books/library')}
                disabled={isUploading}
                className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || !pdfFile || !title.trim()}
                className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploading ? 'Adding Book...' : 'Add Book'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}