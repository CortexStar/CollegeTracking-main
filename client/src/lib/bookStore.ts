// client/src/lib/bookStore.ts
export interface BookMeta {
  id: string;
  title: string;
  author: string;
  url?: string;
  storedName?: string;
  originalName?: string;
  isBuiltIn?: boolean;
  pdfData?: string;
  fileSize?: number;
  uploadDate?: string;
}

interface StorageAdapter {
  saveBook(book: BookMeta): Promise<BookMeta>;
  getBook(id: string): Promise<BookMeta | null>;
  getBooks(): Promise<BookMeta[]>;
  deleteBook(id: string): Promise<void>;
  updateBook(id: string, patch: Partial<BookMeta>): Promise<void>;
}

// In-memory storage for immediate use (fallback when server fails)
class MemoryStorageAdapter implements StorageAdapter {
  private books = new Map<string, BookMeta>();
  private initialized = false;

  private initialize() {
    if (this.initialized) return;
    
    // Initialize with default book
    const defaultBook: BookMeta = {
      id: "linear-algebra-default",
      title: "Introduction to Linear Algebra",
      author: "Gilbert Strang",
      url: "/linear-algebra-book.pdf",
      isBuiltIn: true,
      uploadDate: new Date().toISOString()
    };
    
    this.books.set(defaultBook.id, defaultBook);
    this.initialized = true;
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    this.initialize();
    
    if (!book.id) {
      book.id = `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    
    const savedBook = {
      ...book,
      uploadDate: book.uploadDate || new Date().toISOString(),
      fileSize: book.pdfData ? Math.floor(book.pdfData.length * 0.75) : undefined, // Estimate size from base64
      // For memory storage, create a blob URL for the PDF data
      url: book.pdfData && !book.isBuiltIn ? this.createBlobUrl(book.pdfData) : book.url
    };
    
    this.books.set(book.id, savedBook);
    return savedBook;
  }

  private createBlobUrl(base64Data: string): string {
    try {
      const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to create blob URL:', error);
      return base64Data; // Fallback to base64 data URL
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    this.initialize();
    const book = this.books.get(id);
    
    if (!book) return null;
    
    // If book has pdfData but no URL (or invalid URL), create a fresh blob URL
    if (book.pdfData && !book.isBuiltIn && (!book.url || !book.url.startsWith('blob:'))) {
      const blobUrl = this.createBlobUrl(book.pdfData);
      const updatedBook = { ...book, url: blobUrl };
      this.books.set(id, updatedBook);
      return updatedBook;
    }
    
    return book;
  }

  async getBooks(): Promise<BookMeta[]> {
    this.initialize();
    return Array.from(this.books.values());
  }

  async deleteBook(id: string): Promise<void> {
    this.initialize();
    this.books.delete(id);
  }

  async updateBook(id: string, patch: Partial<BookMeta>): Promise<void> {
    this.initialize();
    const existing = this.books.get(id);
    if (existing) {
      this.books.set(id, { ...existing, ...patch });
    }
  }
}

// Server storage adapter with robust error handling
class ServerStorageAdapter implements StorageAdapter {
  private userId: string;
  private fallback: MemoryStorageAdapter;

  constructor() {
    this.userId = this.getUserId();
    this.fallback = new MemoryStorageAdapter();
  }

  private getUserId(): string {
    // Generate a persistent anonymous user ID
    const storageKey = "pdf_reader_user_id";
    let userId = "";
    
    try {
      userId = localStorage.getItem(storageKey) || "";
    } catch (e) {
      // localStorage might not be available
    }
    
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      try {
        localStorage.setItem(storageKey, userId);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    return userId;
  }

  private createBlobUrlFromBase64(base64Data: string): string {
    try {
      const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to create blob URL:', error);
      return base64Data; // Fallback to base64 data URL
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  private base64ToBlob(base64: string, mimeType: string = 'application/pdf'): Blob {
    try {
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: mimeType });
    } catch (error) {
      throw new Error(`Failed to convert base64 to blob: ${error.message}`);
    }
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    // Handle built-in books
    if (book.isBuiltIn) {
      return this.fallback.saveBook(book);
    }

    // Validate required fields
    if (!book.title?.trim()) {
      throw new Error('Book title is required');
    }

    if (!book.pdfData) {
      throw new Error('PDF data is required for upload');
    }

    try {
      // Prepare the PDF file
      const pdfBlob = this.base64ToBlob(book.pdfData);
      
      // Create form data
      const formData = new FormData();
      formData.append('pdfFile', pdfBlob, `${book.title}.pdf`);
      formData.append('title', book.title.trim());
      formData.append('author', (book.author || '').trim());
      formData.append('userId', this.userId);
      
      if (book.originalName) {
        formData.append('originalName', book.originalName);
      }

      // Upload to server
      const response = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Upload failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const savedBook = await response.json();
      
      // Return book with proper URL
      return {
        ...savedBook,
        url: `/api/books/${savedBook.id}/file`,
        uploadDate: savedBook.uploadDate || new Date().toISOString()
      };

    } catch (error) {
      console.error('Server upload failed:', error);
      
      // Fallback to memory storage with proper URL generation
      console.warn('Falling back to local storage');
      const fallbackBook = await this.fallback.saveBook(book);
      
      // Ensure the fallback book has a proper URL for PDF display
      if (fallbackBook.pdfData && !fallbackBook.isBuiltIn && !fallbackBook.url?.startsWith('blob:')) {
        fallbackBook.url = this.createBlobUrlFromBase64(fallbackBook.pdfData);
      }
      
      return fallbackBook;
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    // Handle legacy "default" ID
    if (id === "default") {
      const books = await this.getBooks();
      return books.find(b => b.isBuiltIn) || null;
    }

    try {
      // Check fallback first for built-in books
      const fallbackBook = await this.fallback.getBook(id);
      if (fallbackBook?.isBuiltIn) {
        return fallbackBook;
      }

      // For fallback books with PDF data but no proper URL, create blob URL
      if (fallbackBook?.pdfData && !fallbackBook.url?.startsWith('blob:') && !fallbackBook.isBuiltIn) {
        fallbackBook.url = this.createBlobUrlFromBase64(fallbackBook.pdfData);
        return fallbackBook;
      }

      // Try server
      const response = await this.makeRequest(`/api/books/${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return fallbackBook; // Return fallback if exists
        }
        throw new Error(`Failed to fetch book: ${response.status}`);
      }

      const serverBook = await response.json();
      return {
        ...serverBook,
        url: `/api/books/${serverBook.id}/file`
      };

    } catch (error) {
      console.error('Error fetching book from server:', error);
      return this.fallback.getBook(id);
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    try {
      // Get fallback books (built-in)
      const fallbackBooks = await this.fallback.getBooks();
      const builtInBooks = fallbackBooks.filter(book => book.isBuiltIn);

      // Try to get server books
      const response = await this.makeRequest(`/api/books?userId=${encodeURIComponent(this.userId)}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch books from server, using fallback');
        return builtInBooks;
      }

      const serverBooks: BookMeta[] = await response.json();
      
      // Add URLs to server books
      const serverBooksWithUrls = serverBooks.map(book => ({
        ...book,
        url: `/api/books/${book.id}/file`
      }));

      // Get fallback books and ensure they have proper URLs
      const fallbackBooksWithUrls = await Promise.all(
        (await this.fallback.getBooks())
          .filter(book => !book.isBuiltIn)
          .map(async book => {
            if (book.pdfData && !book.url?.startsWith('blob:')) {
              return {
                ...book,
                url: this.createBlobUrlFromBase64(book.pdfData)
              };
            }
            return book;
          })
      );

      // Combine built-in, fallback, and server books (remove duplicates by ID)
      const allBooks = [...builtInBooks, ...fallbackBooksWithUrls, ...serverBooksWithUrls];
      const uniqueBooks = allBooks.filter((book, index, self) => 
        index === self.findIndex(b => b.id === book.id)
      );

      return uniqueBooks;

    } catch (error) {
      console.error('Error fetching books:', error);
      const fallbackBooks = await this.fallback.getBooks();
      
      // Ensure fallback books have proper URLs for PDF display
      return Promise.all(
        fallbackBooks.map(async book => {
          if (book.pdfData && !book.isBuiltIn && !book.url?.startsWith('blob:')) {
            return {
              ...book,
              url: this.createBlobUrlFromBase64(book.pdfData)
            };
          }
          return book;
        })
      );
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      // Check if it's a built-in book
      const fallbackBook = await this.fallback.getBook(id);
      if (fallbackBook?.isBuiltIn) {
        return this.fallback.deleteBook(id);
      }

      // Try to delete from server
      const response = await this.makeRequest(`/api/books/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete book: ${response.status}`);
      }

    } catch (error) {
      console.error('Error deleting book:', error);
      // Try fallback deletion anyway
      await this.fallback.deleteBook(id);
    }
  }

  async updateBook(id: string, patch: Partial<BookMeta>): Promise<void> {
    try {
      // Check if it's a built-in book
      const fallbackBook = await this.fallback.getBook(id);
      if (fallbackBook?.isBuiltIn) {
        return this.fallback.updateBook(id, patch);
      }

      // Try to update on server
      const response = await this.makeRequest(`/api/books/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });

      if (!response.ok) {
        throw new Error(`Failed to update book: ${response.status}`);
      }

    } catch (error) {
      console.error('Error updating book:', error);
      // Try fallback update anyway
      await this.fallback.updateBook(id, patch);
    }
  }
}

// Main book store class
class BookStore {
  private storage: StorageAdapter;
  private listeners = new Set<() => void>();

  constructor() {
    this.storage = new ServerStorageAdapter();
  }

  // Event handling
  onBooksChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error in book change listener:', error);
      }
    });
  }

  // Book operations
  async getBooks(): Promise<BookMeta[]> {
    return this.storage.getBooks();
  }

  async getBook(id: string): Promise<BookMeta | null> {
    return this.storage.getBook(id);
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    try {
      const savedBook = await this.storage.saveBook(book);
      this.notifyListeners();
      return savedBook;
    } catch (error) {
      console.error('Failed to save book:', error);
      throw error;
    }
  }

  async updateBook(id: string, patch: Partial<Pick<BookMeta, "title" | "author">>): Promise<void> {
    try {
      await this.storage.updateBook(id, patch);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  }

  async deleteBook(id: string): Promise<BookMeta[]> {
    try {
      await this.storage.deleteBook(id);
      this.notifyListeners();
      return this.getBooks();
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw error;
    }
  }

  // Clean up blob URLs to prevent memory leaks
  cleanupBlobUrls(): void {
    // This would be called when the app is closing or when books are no longer needed
    // For now, we'll let the browser handle cleanup automatically
  }

  // Utility methods
  async uploadPdfFile(file: File, metadata: Partial<BookMeta> = {}): Promise<BookMeta> {
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Please select a valid PDF file');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File size must be less than 50MB');
    }

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const book: BookMeta = {
        id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: metadata.title || file.name.replace('.pdf', ''),
        author: metadata.author || '',
        originalName: file.name,
        pdfData: base64Data,
        fileSize: file.size,
        ...metadata
      };

      return this.saveBook(book);
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      throw error;
    }
  }

  // Initialize default books
  async initializeDefaultBooks(): Promise<void> {
    try {
      const books = await this.getBooks();
      const hasDefault = books.some(book => book.isBuiltIn);
      
      if (!hasDefault) {
        const defaultBook: BookMeta = {
          id: "linear-algebra-default",
          title: "Introduction to Linear Algebra",
          author: "Gilbert Strang",
          url: "/linear-algebra-book.pdf",
          isBuiltIn: true
        };
        
        await this.saveBook(defaultBook);
      }
    } catch (error) {
      console.error('Failed to initialize default books:', error);
    }
  }
}

// Export singleton instance
export const bookStore = new BookStore();

// Export individual functions for compatibility
export const onBooksChange = (fn: () => void) => bookStore.onBooksChange(fn);
export const getBooks = () => bookStore.getBooks();
export const getBook = (id: string) => bookStore.getBook(id);
export const saveBook = (book: BookMeta) => bookStore.saveBook(book);
export const updateBook = (id: string, patch: Partial<Pick<BookMeta, "title" | "author">>) => 
  bookStore.updateBook(id, patch);
export const deleteBook = (id: string) => bookStore.deleteBook(id);
export const initializeDefaultBooks = () => bookStore.initializeDefaultBooks();

// New utility exports
export const uploadPdfFile = (file: File, metadata?: Partial<BookMeta>) => 
  bookStore.uploadPdfFile(file, metadata);

// Legacy compatibility
export function getEstimatedLocalStorageSize(): number {
  return 0;
}