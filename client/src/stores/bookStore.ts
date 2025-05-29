import type { BookMeta, StorageAdapter } from '@/types/book'; // Assuming @ is client/src

class ServerStorageAdapter implements StorageAdapter {
  // NEXT_PUBLIC_API_URL is usually for Next.js. For Vite, use import.meta.env.VITE_API_URL or similar.
  // Assuming /api is fine for now if client and server are on the same origin during dev.
  private baseUrl = '/api'; 
  private timeout = 120000; // Increased to 2 minutes for large file uploads

  // Helper for user ID, though server uses hardcoded "anonymous-user"
  private getCurrentUserId(): string {
    return 'anonymous-user'; // Matches server-side hardcoded user
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    const formData = new FormData();

    if (book.pdfFileContent) {
      formData.append('pdfFile', book.pdfFileContent, book.originalName || book.pdfFileContent.name);
    } else if (book.pdfData) {
      const blob = this.base64ToBlob(book.pdfData, book.originalName || 'book.pdf');
      formData.append('pdfFile', blob, book.originalName || 'book.pdf');
    } else {
      throw new Error('No PDF file content or data provided to saveBook.');
    }

    formData.append('title', book.title);
    if (book.author) formData.append('author', book.author);
    // userId is handled by the server, no need to send from client anymore

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/books/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.url) {
        console.error('Server response missing PDF URL:', responseData);
        throw new Error('Server response missing PDF URL');
      }
      
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Upload timed out after', this.timeout/1000, 'seconds');
          throw new Error(`Upload timeout after ${this.timeout/1000} seconds - file may be too large or network issue.`);
        }
        if (error.message.includes('Failed to fetch')) {
          console.error('Network error during upload:', error);
          throw new Error('Network error during upload - server may be unavailable');
        }
      }
      console.error('Unexpected error during upload:', error);
      throw error;
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    try {
      // userId query param removed, server handles user context
      const response = await fetch(`${this.baseUrl}/books/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching book:', error);
      // Fallback to null or rethrow to let BookStore handle memory adapter switch
      // As per current BookStore logic, throwing an error will trigger memory fallback.
      if (error instanceof Error && error.message.includes('Server error')) throw error;
      return null;
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    try {
      // userId query param removed
      const response = await fetch(`${this.baseUrl}/books`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        console.error('Server returned error for getBooks:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
      const books = await response.json();
      console.log(`Successfully fetched ${books.length} books from server`);
      return books;
    } catch (error) {
      console.error('Error fetching books from server:', error);
      // Rethrow to trigger fallback logic in BookStore
      throw error; 
    }
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    // Server expects title, author, metadataJson. Filter updates for these fields.
    const validUpdates: Partial<{ title: string; author: string; metadataJson: Record<string, any> }> = {};
    if (updates.title !== undefined) validUpdates.title = updates.title;
    if (updates.author !== undefined) validUpdates.author = updates.author;
    // Assuming BookMeta might have a metadata field matching metadataJson structure
    if ((updates as any).metadataJson !== undefined) validUpdates.metadataJson = (updates as any).metadataJson;
    else if ((updates as any).metadata !== undefined) validUpdates.metadataJson = (updates as any).metadata;


    if (Object.keys(validUpdates).length === 0) {
        // Or return current book data if no valid fields to update?
        // For now, let the server handle it or throw client error.
        // const currentBook = await this.getBook(id); // Avoid if not necessary
        // if (currentBook) return currentBook;
        throw new Error("No valid fields provided for update.");
    }

    const response = await fetch(`${this.baseUrl}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUpdates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
    }
    return await response.json();
  }

  async deleteBook(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        console.error('Delete failed:', errorData);
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  private base64ToBlob(base64: string, filename: string = 'file.pdf'): Blob {
    const parts = base64.split(',');
    const contentType = parts[0].match(/:(.*?);/)![1];
    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private books: Map<string, BookMeta> = new Map();
  private localStorageKey = "bookStoreMemoryBooks";
  private memoryOnlyPdfData: Map<string, string> = new Map();

  constructor() {
    this.loadBooksFromLocalStorage();
  }

  private loadBooksFromLocalStorage(): void {
    try {
      const storedBooks = window.localStorage.getItem(this.localStorageKey);
      if (storedBooks) {
        const parsedBooks: BookMeta[] = JSON.parse(storedBooks);
        parsedBooks.forEach(book => {
          if (book.uploadDate) book.uploadDate = new Date(book.uploadDate);
          
          // Handle PDF data based on its storage method
          if (book.pdfData === 'STORED_SEPARATELY') {
            try {
              const pdfData = window.localStorage.getItem(`${this.localStorageKey}_pdf_${book.id}`);
              if (pdfData) {
                book.pdfData = pdfData;
                if (book.pdfData.startsWith('data:application/pdf;base64,')) {
                  book.url = this.createBlobUrl(book.pdfData);
                }
              } else {
                console.warn(`PDF data for book ${book.id} not found in localStorage`);
                book.pdfData = undefined;
              }
            } catch (pdfError) {
              console.warn(`Could not load PDF data for book ${book.id}:`, pdfError);
              book.pdfData = undefined;
            }
          } else if (book.pdfData === 'MEMORY_ONLY') {
            const memoryPdfData = this.memoryOnlyPdfData.get(book.id);
            if (memoryPdfData) {
              book.pdfData = memoryPdfData;
              if (book.pdfData.startsWith('data:application/pdf;base64,')) {
                book.url = this.createBlobUrl(book.pdfData);
              }
            } else {
              console.warn(`Memory-only PDF data for book ${book.id} not found`);
              book.pdfData = undefined;
            }
          }
          
          // If book has server URL but no blob URL was created, keep the server URL
          if (!book.url && book.pdfData && book.pdfData.startsWith('data:application/pdf;base64,')) {
            book.url = this.createBlobUrl(book.pdfData);
          }

          this.books.set(book.id, book);
        });
      }
    } catch (error) {
      console.error("Error loading books from localStorage:", error);
      this.books = new Map(); 
    }
  }

  private saveBooksToLocalStorage(): void {
    try {
      const booksToStore = Array.from(this.books.values()).map(book => {
        // Create a clone to avoid modifying the original book
        const bookForStorage = { ...book };
        
        // Handle PDF data storage strategy based on size
        if (bookForStorage.pdfData) {
          try {
            const dataSize = bookForStorage.pdfData.length * 2; // Rough estimate of byte size
            
            // For large files, store in memory only
            if (dataSize > 4 * 1024 * 1024) { // 4MB limit for localStorage
              console.log(`PDF data for book ${book.id} is large, keeping in memory only.`);
              this.memoryOnlyPdfData.set(book.id, bookForStorage.pdfData);
              bookForStorage.pdfData = 'MEMORY_ONLY';
            } else {
              // For smaller files, store in localStorage separately
              window.localStorage.setItem(`${this.localStorageKey}_pdf_${book.id}`, bookForStorage.pdfData);
              bookForStorage.pdfData = 'STORED_SEPARATELY';
            }
          } catch (pdfError) {
            console.warn(`Could not save PDF data for book ${book.id} to localStorage:`, pdfError);
            this.memoryOnlyPdfData.set(book.id, bookForStorage.pdfData);
            bookForStorage.pdfData = 'MEMORY_ONLY';
          }
        }
        
        // Don't store File objects
        delete bookForStorage.pdfFileContent;
        
        // Don't store blob URLs directly as they're not persistent
        if (bookForStorage.url && bookForStorage.url.startsWith('blob:')) {
          if (bookForStorage.pdfData !== 'STORED_SEPARATELY' && bookForStorage.pdfData !== 'MEMORY_ONLY') {
            bookForStorage.url = undefined;
          }
        }
        
        return bookForStorage;
      });
      
      window.localStorage.setItem(this.localStorageKey, JSON.stringify(booksToStore));
    } catch (error) {
      console.error("Error saving books to localStorage:", error);
    }
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    const id = book.id || `mem-book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const savedBook: BookMeta = {
      ...book,
      id,
      uploadDate: book.uploadDate || new Date(),
    };

    // Convert File to base64 if provided
    if (book.pdfFileContent && !book.pdfData) {
      savedBook.pdfData = await this.fileToBase64(book.pdfFileContent);
    }

    // Create blob URL if needed
    if (!savedBook.url && savedBook.pdfData && savedBook.pdfData.startsWith('data:application/pdf;base64,')) {
      savedBook.url = this.createBlobUrl(savedBook.pdfData);
    }

    this.books.set(id, savedBook);
    this.saveBooksToLocalStorage();
    return { ...savedBook }; // Return a copy to avoid reference issues
  }

  async getBook(id: string): Promise<BookMeta | null> {
    const book = this.books.get(id);
    if (!book) return null;
    
    // If we have book but no URL, try to recreate it
    if (!book.url && book.pdfData && book.pdfData.startsWith('data:application/pdf;base64,')) {
      book.url = this.createBlobUrl(book.pdfData);
    }
    
    return { ...book }; // Return a copy to avoid reference issues
  }

  async getBooks(): Promise<BookMeta[]> {
    // Make sure any book with data has a URL
    this.books.forEach(book => {
      if (!book.url && book.pdfData && book.pdfData.startsWith('data:application/pdf;base64,')) {
        book.url = this.createBlobUrl(book.pdfData);
      }
    });
    
    return Array.from(this.books.values()).map(book => ({ ...book })); // Return copies
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    const book = this.books.get(id);
    if (!book) throw new Error('Book not found for update in memory');
    
    const updatedBook = { ...book, ...updates, id };
    
    // Handle PDF file updates
    if (updates.pdfFileContent && updates.pdfFileContent !== book.pdfFileContent) {
      updatedBook.pdfData = await this.fileToBase64(updates.pdfFileContent);
      updatedBook.url = this.createBlobUrl(updatedBook.pdfData!);
    } else if (updates.pdfData && updates.pdfData !== book.pdfData && !updates.url && updates.pdfData.startsWith('data:application/pdf;base64,')) {
      updatedBook.url = this.createBlobUrl(updates.pdfData);
    }

    this.books.set(id, updatedBook);
    this.saveBooksToLocalStorage();
    return { ...updatedBook }; // Return a copy
  }

  async deleteBook(id: string): Promise<void> {
    this.books.delete(id);
    window.localStorage.removeItem(`${this.localStorageKey}_pdf_${id}`);
    this.memoryOnlyPdfData.delete(id);
    this.saveBooksToLocalStorage();
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private createBlobUrl(base64OrDataUri: string): string {
    try {
      let mimeString = 'application/pdf';
      let byteCharacters: string;
      
      if (base64OrDataUri.startsWith('data:')) {
        const parts = base64OrDataUri.split(',');
        const metaPart = parts[0];
        byteCharacters = atob(parts[1]);
        mimeString = metaPart.split(':')[1].split(';')[0];
      } else {
        byteCharacters = atob(base64OrDataUri);
      }
      
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeString });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error creating blob URL:", error);
      return "";
    }
  }
}

class BookStore {
  private adapter: StorageAdapter;
  private listeners: Set<() => void> = new Set();
  private memoryAdapter: MemoryStorageAdapter;
  private serverAdapter: ServerStorageAdapter;
  private initialized = false;
  private serverAvailable = false;
  private cachedBooks: Map<string, BookMeta> = new Map();
  private lastFetch: number = 0;
  private fetchInterval: number = 5000; // 5 seconds minimum between fetches

  constructor() {
    this.memoryAdapter = new MemoryStorageAdapter();
    this.serverAdapter = new ServerStorageAdapter();
    this.adapter = this.serverAdapter; // Start with server adapter
  }

  private async refreshBooks(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval) {
      return; // Skip if fetched recently
    }
    
    try {
      const books = await this.adapter.getBooks();
      this.cachedBooks.clear();
      books.forEach(book => this.cachedBooks.set(book.id, book));
      this.lastFetch = now;
      this.notifyListeners();
    } catch (error) {
      console.error('Error refreshing books:', error);
      throw error;
    }
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    await this.ensureInitialized();
    try {
      const savedBook = await this.adapter.saveBook(book);
      this.cachedBooks.set(savedBook.id, savedBook);
      this.notifyListeners();
      return savedBook;
    } catch (error) {
      if (this.adapter === this.serverAdapter) {
        console.warn('Primary adapter saveBook failed, attempting memory adapter:', error);
        const memoryBook = await this.memoryAdapter.saveBook(book);
        this.cachedBooks.set(memoryBook.id, memoryBook);
        this.notifyListeners();
        return memoryBook;
      }
      throw error;
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    await this.ensureInitialized();
    
    // Check cache first
    const cachedBook = this.cachedBooks.get(id);
    if (cachedBook && cachedBook.isActive !== false) {
      return cachedBook;
    }

    try {
      const book = await this.adapter.getBook(id);
      if (book) {
        this.cachedBooks.set(id, book);
      } else {
        this.cachedBooks.delete(id);
      }
      return book;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    await this.ensureInitialized();
    
    // Return cached books if recently fetched
    const now = Date.now();
    if (this.cachedBooks.size > 0 && now - this.lastFetch < this.fetchInterval) {
      return Array.from(this.cachedBooks.values()).filter(book => book.isActive !== false);
    }

    await this.refreshBooks();
    return Array.from(this.cachedBooks.values()).filter(book => book.isActive !== false);
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    await this.ensureInitialized();
    
    // For updates, try to reconnect to server if not available
    if (!this.serverAvailable) {
      await this.retryServerConnection();
    }

    try {
      const updated = await this.adapter.updateBook(id, updates);
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.warn('Primary adapter updateBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
        this.serverAvailable = false;
        this.adapter = this.memoryAdapter;
        const updated = await this.memoryAdapter.updateBook(id, updates);
        this.notifyListeners();
        return updated;
      }
      throw error;
    }
  }

  async deleteBook(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.adapter.deleteBook(id);
      // Remove from cache completely instead of just marking inactive
      this.cachedBooks.delete(id);
      this.notifyListeners();
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  async uploadPdfFile(file: File, metadata: Partial<BookMeta>): Promise<BookMeta> {
    const bookData: BookMeta = {
      id: '', // Server will generate ID
      title: metadata.title || file.name.replace(/\.pdf$/i, ''),
      author: metadata.author,
      pdfFileContent: file,
      originalName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      // url will be populated by the server response
    };
    return this.saveBook(bookData);
  }

  onBooksChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Add method to manually check server availability (useful for debugging)
  async checkServerStatus(): Promise<{ available: boolean; adapter: string; error?: string }> {
    try {
      await this.serverAdapter.getBooks();
      return { 
        available: true, 
        adapter: this.adapter === this.serverAdapter ? 'server' : 'memory' 
      };
    } catch (error) {
      return { 
        available: false, 
        adapter: this.adapter === this.serverAdapter ? 'server' : 'memory',
        error: error.message 
      };
    }
  }

  // Method to force reinitialize connection (useful for debugging)
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.serverAvailable = false;
    this.adapter = this.serverAdapter;
    
    // Try to initialize with server, fallback to memory if needed
    try {
      await this.serverAdapter.getBooks();
      this.serverAvailable = true;
      this.adapter = this.serverAdapter;
    } catch (error) {
      console.warn('Server not available during initialization, using memory adapter:', error.message);
      this.serverAvailable = false;
      this.adapter = this.memoryAdapter;
    }
    
    this.initialized = true;
    this.notifyListeners();
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.reinitialize();
    }
  }

  // Add method to retry server connection
  private async retryServerConnection(): Promise<boolean> {
    if (this.serverAvailable) return true;

    try {
      await this.serverAdapter.getBooks();
      console.log('Server reconnection successful, switching back to ServerStorageAdapter.');
      this.adapter = this.serverAdapter;
      this.serverAvailable = true;
      return true;
    } catch (error) {
      console.warn('Server reconnection failed:', error.message);
      return false;
    }
  }
}

export const bookStore = new BookStore(); 