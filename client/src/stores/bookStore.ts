import type { BookMeta, StorageAdapter } from '@/types/book'; // Assuming @ is client/src

class ServerStorageAdapter implements StorageAdapter {
  // NEXT_PUBLIC_API_URL is usually for Next.js. For Vite, use import.meta.env.VITE_API_URL or similar.
  // Assuming /api is fine for now if client and server are on the same origin during dev.
  private baseUrl = '/api'; 
  private timeout = 30000; // Increased for file uploads

  // Helper for user ID, though server uses hardcoded "anonymous-user"
  private getCurrentUserId(): string {
    return 'anonymous-user'; // Matches server-side hardcoded user
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    const formData = new FormData();

    if (book.pdfFileContent) {
      formData.append('pdfFile', book.pdfFileContent, book.originalName || book.pdfFileContent.name);
    } else if (book.pdfData) { // For cases where pdfData (base64) might be used as a source
      // This scenario is less likely with the new server setup which expects a File.
      // However, keeping it for robustness if client ever creates BookMeta with base64 directly.
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
      // Endpoint for upload is /api/books/upload
      const response = await fetch(`${this.baseUrl}/books/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Ensure the response contains a valid URL for the PDF
      if (!responseData.url) {
        console.warn('Server response missing PDF URL:', responseData);
        throw new Error('Server response missing PDF URL');
      }
      
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timeout - file may be too large or network issue.');
      }
      
      // For network errors or other fetch failures
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error during upload - server may be unavailable');
      }
      
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
    const response = await fetch(`${this.baseUrl}/books/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 204) { // 204 is success for DELETE
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
    }
    // No need to return response.json() for DELETE if server sends 204
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
  private initializationPromise: Promise<void>;
  private serverAdapter: ServerStorageAdapter;
  private initialized = false;
  private serverAvailable = false;

  constructor() {
    this.memoryAdapter = new MemoryStorageAdapter();
    this.serverAdapter = new ServerStorageAdapter();
    this.adapter = this.serverAdapter; // Start with server adapter
    this.initializationPromise = this.testConnection();
  }

  private async testConnection() {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second between retries

    while (retryCount < maxRetries) {
      try {
        // Reduced timeout for quicker fallback, but with retries
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000) // 3s timeout per attempt
        );
        
        await Promise.race([
          this.serverAdapter.getBooks(), 
          timeoutPromise
        ]);
        
        console.log('Server connection successful, using ServerStorageAdapter.');
        this.adapter = this.serverAdapter;
        this.serverAvailable = true;
        this.initialized = true;
        return;
      } catch (error) {
        retryCount++;
        console.warn(`Server connection attempt ${retryCount}/${maxRetries} failed:`, error.message);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying connection in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All retries failed, fall back to memory adapter
    console.warn('All server connection attempts failed, using memory adapter.');
    this.adapter = this.memoryAdapter;
    this.serverAvailable = false;
    this.initialized = true;
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

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializationPromise;
    }
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    await this.ensureInitialized();
    
    // Always try server first for saves, even if we're currently on memory adapter
    if (!this.serverAvailable) {
      await this.retryServerConnection();
    }

    try {
      const saved = await this.adapter.saveBook(book);
      this.notifyListeners();
      return saved;
    } catch (error) {
      console.warn('Primary adapter saveBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
        // Mark server as unavailable and switch to memory
        this.serverAvailable = false;
        this.adapter = this.memoryAdapter;
        const saved = await this.memoryAdapter.saveBook(book);
        this.notifyListeners();
        return saved;
      }
      throw error;
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    await this.ensureInitialized();
    
    try {
      return await this.adapter.getBook(id);
    } catch (error) {
      console.warn('Primary adapter getBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
        this.serverAvailable = false;
        this.adapter = this.memoryAdapter;
        return await this.memoryAdapter.getBook(id);
      }
      return null;
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    await this.ensureInitialized();
    
    try {
      const books = await this.adapter.getBooks();
      return books;
    } catch (error) {
      console.warn('Primary adapter getBooks failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
        this.serverAvailable = false;
        this.adapter = this.memoryAdapter;
        const fallbackBooks = await this.memoryAdapter.getBooks();
        
        // If we have cached books, show a message about offline mode
        if (fallbackBooks.length > 0) {
          console.info('Using cached books in offline mode');
        }
        
        return fallbackBooks;
      }
      return [];
    }
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
    
    // For deletes, try to reconnect to server if not available
    if (!this.serverAvailable) {
      await this.retryServerConnection();
    }

    try {
      await this.adapter.deleteBook(id);
      this.notifyListeners();
    } catch (error) {
      console.warn('Primary adapter deleteBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
        this.serverAvailable = false;
        this.adapter = this.memoryAdapter;
        await this.memoryAdapter.deleteBook(id);
        this.notifyListeners();
        return;
      }
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
    this.initializationPromise = this.testConnection();
    await this.initializationPromise;
    this.notifyListeners();
  }
}

export const bookStore = new BookStore(); 