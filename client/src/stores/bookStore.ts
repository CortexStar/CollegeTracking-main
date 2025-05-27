import { BookMeta, StorageAdapter } from '@/types/book';

class ServerStorageAdapter implements StorageAdapter {
  private baseUrl = '/api';
  private timeout = 10000;

  async saveBook(book: BookMeta): Promise<BookMeta> {
    const formData = new FormData();
    
    if (book.pdfFileContent) {
      formData.append('pdfFile', book.pdfFileContent);
    } else if (book.pdfData) {
      const blob = this.base64ToBlob(book.pdfData);
      formData.append('pdfFile', blob, book.originalName || 'book.pdf');
    }
    
    formData.append('title', book.title);
    if (book.author) formData.append('author', book.author);
    formData.append('userId', 'default-user'); // Replace with actual user ID

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/books`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    try {
      const response = await fetch(`${this.baseUrl}/books/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    try {
      const response = await fetch(`${this.baseUrl}/books`);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    const response = await fetch(`${this.baseUrl}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  }

  async deleteBook(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/books/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
  }

  private base64ToBlob(base64: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private books: Map<string, BookMeta> = new Map();

  constructor() {
    // No default books - start with empty library
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    const id = book.id || this.generateId();
    const savedBook: BookMeta = {
      ...book,
      id,
      uploadDate: new Date(),
    };

    if (book.pdfFileContent && !book.pdfData) {
      savedBook.pdfData = await this.fileToBase64(book.pdfFileContent);
      savedBook.url = this.createBlobUrl(savedBook.pdfData);
    }

    this.books.set(id, savedBook);
    return savedBook;
  }

  async getBook(id: string): Promise<BookMeta | null> {
    return this.books.get(id) || null;
  }

  async getBooks(): Promise<BookMeta[]> {
    return Array.from(this.books.values());
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    const book = this.books.get(id);
    if (!book) throw new Error('Book not found');
    
    const updated = { ...book, ...updates };
    this.books.set(id, updated);
    return updated;
  }

  async deleteBook(id: string): Promise<void> {
    this.books.delete(id);
  }

  private generateId(): string {
    return `book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private createBlobUrl(base64: string): string {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }
}

class BookStore {
  private adapter: StorageAdapter;
  private listeners: Set<() => void> = new Set();
  private memoryAdapter: MemoryStorageAdapter;

  constructor() {
    this.memoryAdapter = new MemoryStorageAdapter();
    this.adapter = new ServerStorageAdapter();
    // Fallback to memory adapter if server is unavailable
    this.testConnection();
  }

  private async testConnection() {
    try {
      await this.adapter.getBooks();
    } catch (error) {
      console.warn('Server unavailable, using memory adapter');
      this.adapter = this.memoryAdapter;
    }
  }

  async saveBook(book: BookMeta): Promise<BookMeta> {
    try {
      const saved = await this.adapter.saveBook(book);
      this.notifyListeners();
      return saved;
    } catch (error) {
      console.warn('Save failed, falling back to memory adapter');
      this.adapter = this.memoryAdapter;
      const saved = await this.memoryAdapter.saveBook(book);
      this.notifyListeners();
      return saved;
    }
  }

  async getBook(id: string): Promise<BookMeta | null> {
    try {
      return await this.adapter.getBook(id);
    } catch (error) {
      console.warn('GetBook failed, falling back to memory adapter');
      this.adapter = this.memoryAdapter;
      return await this.memoryAdapter.getBook(id);
    }
  }

  async getBooks(): Promise<BookMeta[]> {
    try {
      return await this.adapter.getBooks();
    } catch (error) {
      console.warn('GetBooks failed, falling back to memory adapter');
      this.adapter = this.memoryAdapter;
      return await this.memoryAdapter.getBooks();
    }
  }

  async updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta> {
    try {
      const updated = await this.adapter.updateBook(id, updates);
      this.notifyListeners();
      return updated;
    } catch (error) {
      console.warn('UpdateBook failed, falling back to memory adapter');
      this.adapter = this.memoryAdapter;
      const updated = await this.memoryAdapter.updateBook(id, updates);
      this.notifyListeners();
      return updated;
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      await this.adapter.deleteBook(id);
      this.notifyListeners();
    } catch (error) {
      console.warn('DeleteBook failed, falling back to memory adapter');
      this.adapter = this.memoryAdapter;
      await this.memoryAdapter.deleteBook(id);
      this.notifyListeners();
    }
  }

  async uploadPdfFile(file: File, metadata: Partial<BookMeta>): Promise<BookMeta> {
    const bookData: BookMeta = {
      id: '',
      title: metadata.title || file.name.replace('.pdf', ''),
      author: metadata.author,
      pdfFileContent: file,
      originalName: file.name,
      fileSize: file.size,
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