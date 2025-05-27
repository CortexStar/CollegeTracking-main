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
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timeout - file may be too large or network issue.');
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
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching books:', error);
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
          if (book.pdfData === 'STORED_SEPARATELY') {
            try {
              const pdfData = window.localStorage.getItem(`${this.localStorageKey}_pdf_${book.id}`);
              if (pdfData) {
                book.pdfData = pdfData;
                if (book.pdfData.startsWith('data:application/pdf;base64,')) {
                  book.url = this.createBlobUrl(book.pdfData);
                }
              } else {
                book.pdfData = undefined;
              }
            } catch (pdfError) {
              console.warn(`Could not load PDF data for book ${book.id}:`, pdfError);
              book.pdfData = undefined;
            }
          } else if (book.pdfData === 'MEMORY_ONLY' && this.memoryOnlyPdfData.has(book.id)) {
             const memoryPdfData = this.memoryOnlyPdfData.get(book.id);
             if(memoryPdfData){
                book.pdfData = memoryPdfData;
                if (book.pdfData.startsWith('data:application/pdf;base64,')) {
                  book.url = this.createBlobUrl(book.pdfData);
                }
             }
          }
          // If book.url is missing and pdfData is present, recreate blob url. Needed after page reload for memory/LS stored items.
          // However, with server storage, URL should come from server.
          // This logic is more for the fallback scenario.
          if (!book.url && book.pdfData && book.pdfData.startsWith('data:application/pdf;base64,')){
              book.url = this.createBlobUrl(book.pdfData);
          }

        });
        this.books = new Map(parsedBooks.map(book => [book.id, book]));
      }
    } catch (error) {
      console.error("Error loading books from localStorage:", error);
      this.books = new Map(); 
    }
  }

  private saveBooksToLocalStorage(): void {
    try {
      const booksToStoreJs = Array.from(this.books.values());
      const booksToStore = booksToStoreJs.map(book => {
        const bookForStorage = { ...book };
        if (bookForStorage.pdfData) {
          try {
            const dataSize = bookForStorage.pdfData.length * 2;
            if (dataSize > 4 * 1024 * 1024) { // 4MB limit for safety
              console.warn(`PDF data for book ${book.id} is too large for localStorage. Keeping in memory only.`);
              this.memoryOnlyPdfData.set(book.id, bookForStorage.pdfData);
              bookForStorage.pdfData = 'MEMORY_ONLY';
            } else {
              window.localStorage.setItem(`${this.localStorageKey}_pdf_${book.id}`, bookForStorage.pdfData);
              bookForStorage.pdfData = 'STORED_SEPARATELY';
            }
          } catch (pdfError) {
            console.warn(`Could not save PDF data for book ${book.id} to localStorage:`, pdfError);
            this.memoryOnlyPdfData.set(book.id, bookForStorage.pdfData);
            bookForStorage.pdfData = 'MEMORY_ONLY';
          }
        }
        delete bookForStorage.pdfFileContent; // Remove File object
        // Blob URLs are not persistent, so they shouldn't be saved directly.
        // If it's a blob URL, it implies the data is in pdfData (base64) or was from a File.
        // When loaded, if pdfData is present, a new blob URL will be created.
        // If pdfData is not 'STORED_SEPARATELY' or 'MEMORY_ONLY', it means no local data, rely on server url.
        if (bookForStorage.url && bookForStorage.url.startsWith('blob:') && bookForStorage.pdfData !== 'STORED_SEPARATELY' && bookForStorage.pdfData !== 'MEMORY_ONLY') {
            bookForStorage.url = undefined; 
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

    if (book.pdfFileContent && !book.pdfData) {
      savedBook.pdfData = await this.fileToBase64(book.pdfFileContent);
    }

    if (!savedBook.url && savedBook.pdfData && savedBook.pdfData.startsWith('data:application/pdf;base64,')) {
      savedBook.url = this.createBlobUrl(savedBook.pdfData);
    }

    this.books.set(id, savedBook);
    this.saveBooksToLocalStorage();
    return savedBook;
  }

  async getBook(id: string): Promise<BookMeta | null> {
    this.loadBooksFromLocalStorage();
    return this.books.get(id) || null;
  }

  async getBooks(): Promise<BookMeta[]> {
    this.loadBooksFromLocalStorage();
    return Array.from(this.books.values());
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    this.loadBooksFromLocalStorage();
    const book = this.books.get(id);
    if (!book) throw new Error('Book not found for update in memory');
    const updatedBook = { ...book, ...updates, id };
    
    if (updates.pdfFileContent && updates.pdfFileContent !== book.pdfFileContent) {
        updatedBook.pdfData = await this.fileToBase64(updates.pdfFileContent);
        updatedBook.url = this.createBlobUrl(updatedBook.pdfData!);
    } else if (updates.pdfData && updates.pdfData !== book.pdfData && !updates.url && updates.pdfData.startsWith('data:application/pdf;base64,')) {
        updatedBook.url = this.createBlobUrl(updates.pdfData);
    }

    this.books.set(id, updatedBook);
    this.saveBooksToLocalStorage();
    return updatedBook;
  }

  async deleteBook(id: string): Promise<void> {
    this.loadBooksFromLocalStorage();
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
  }
}

class BookStore {
  private adapter: StorageAdapter;
  private listeners: Set<() => void> = new Set();
  private memoryAdapter: MemoryStorageAdapter;
  private initializationPromise: Promise<void>;
  private serverAdapter: ServerStorageAdapter;

  constructor() {
    this.memoryAdapter = new MemoryStorageAdapter();
    this.serverAdapter = new ServerStorageAdapter(); // Create instance of ServerAdapter
    this.adapter = this.serverAdapter; // Default to server adapter
    this.initializationPromise = this.testConnection();
  }

  private async testConnection() {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000) // 5s timeout
      );
      await Promise.race([
        this.serverAdapter.getBooks(), // Test with server adapter directly
        timeoutPromise
      ]);
      // console.log('Server connection successful, using ServerStorageAdapter.');
      this.adapter = this.serverAdapter;
    } catch (error) {
      console.warn('Server unavailable or timed out, using memory adapter. Error:', error.message);
      this.adapter = this.memoryAdapter;
    }
  }

  private async ensureInitialized() {
    await this.initializationPromise;
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    await this.ensureInitialized();
    try {
      const saved = await this.adapter.saveBook(book);
      this.notifyListeners();
      return saved;
    } catch (error) {
      console.warn('Primary adapter saveBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) { // Avoid double save if already on memory
        this.adapter = this.memoryAdapter;
        const saved = await this.memoryAdapter.saveBook(book); // Save to memory
        this.notifyListeners();
        return saved;
      }
      throw error; // If memory adapter also fails or was already the adapter
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    await this.ensureInitialized();
    try {
      return await this.adapter.getBook(id);
    } catch (error) {
      console.warn('Primary adapter getBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
         this.adapter = this.memoryAdapter;
         return await this.memoryAdapter.getBook(id);
      }
      return null; // Or throw error if memory adapter was already primary
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    await this.ensureInitialized();
    try {
      return await this.adapter.getBooks();
    } catch (error) {
      console.warn('Primary adapter getBooks failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
          this.adapter = this.memoryAdapter;
          return await this.memoryAdapter.getBooks();
      }
      return []; // Or throw error
    }
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    await this.ensureInitialized();
    try {
      const updated = await this.adapter.updateBook(id, updates);
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.warn('Primary adapter updateBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
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
      this.notifyListeners();
    } catch (error) {
      console.warn('Primary adapter deleteBook failed, attempting memory adapter. Error:', error.message);
      if (this.adapter !== this.memoryAdapter) {
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
}

export const bookStore = new BookStore(); 