// client/src/lib/bookStore.ts
import { apiRequest } from './queryClient';

export interface BookMeta {
  id: string;          // uuid
  title: string;
  author: string;
  url?: string;        // URL to fetch the PDF
  storedName?: string; // Server-side storage name
  originalName?: string; // Original file name
  isBuiltIn?: boolean; // true for default books
  pdfData?: string;    // base64 data for upload/temporary storage
}

// For compatibility with localStorage
const KEY = "books";
const listeners = new Set<() => void>();
const USER_ID_KEY = "current_user_id"; 

// Get or create a persistent user ID for anonymous users
// In a real app, this would be tied to user authentication
function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `anonymous-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// Initialize default books
export function initializeDefaultBooks() {
  const defaultBook: BookMeta = {
    id: "linear-algebra-default",
    title: "Introduction to Linear Algebra",
    author: "Gilbert Strang",
    url: "/linear-algebra-book.pdf",
    isBuiltIn: true
  };
  
  // Initialize with default book on first load
  const localBooks = JSON.parse(localStorage.getItem(KEY) || "[]");
  const hasDefaultBook = localBooks.some((book: BookMeta) => book.id === defaultBook.id);
  
  if (!hasDefaultBook) {
    localBooks.push(defaultBook);
    localStorage.setItem(KEY, JSON.stringify(localBooks));
  }
  
  // The rest will be loaded from server when getBooks() is called
}

export function onBooksChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Fetch books from server and merge with any local built-in books
export async function getBooks(): Promise<BookMeta[]> {
  try {
    // Get local books for backward compatibility
    const localBooks: BookMeta[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    
    // Get server books
    const userId = getUserId();
    const response = await fetch(`/api/books?userId=${userId}`);
    
    if (!response.ok) {
      console.error("Failed to fetch books from server");
      return localBooks; // Fallback to local books
    }
    
    const serverBooks: BookMeta[] = await response.json();
    
    // For each server book, add the URL to fetch the PDF
    const booksWithUrls = serverBooks.map(book => ({
      ...book,
      url: `/api/books/${book.id}/file`
    }));
    
    // Merge, prioritizing server books (except for built-in books which stay local)
    const localBuiltInBooks = localBooks.filter(book => book.isBuiltIn);
    
    // Combine local built-in books with server books
    const allBooks = [...localBuiltInBooks, ...booksWithUrls];
    
    return allBooks;
  } catch (error) {
    console.error("Error fetching books:", error);
    // Fallback to local storage if server request fails
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }
}

// Get a single book by ID
export async function getBook(id: string): Promise<BookMeta | null> {
  if (id === "default") {
    // For backward compatibility - redirect to the default book ID
    const localBooks = JSON.parse(localStorage.getItem(KEY) || "[]");
    const defaultBook = localBooks.find((b: BookMeta) => b.isBuiltIn);
    return defaultBook || null;
  }
  
  // Check local storage first for built-in books
  const localBooks = JSON.parse(localStorage.getItem(KEY) || "[]");
  const localBook = localBooks.find((b: BookMeta) => b.id === id);
  
  if (localBook?.isBuiltIn) {
    return localBook;
  }
  
  // If not a built-in book, fetch from server
  try {
    const response = await fetch(`/api/books/${id}`);
    
    if (!response.ok) {
      console.error("Failed to fetch book from server");
      return localBook; // Fallback to local book if it exists
    }
    
    const serverBook = await response.json();
    return {
      ...serverBook,
      url: `/api/books/${serverBook.id}/file`
    };
  } catch (error) {
    console.error("Error fetching book:", error);
    return localBook; // Fallback to local book if server request fails
  }
}

// Upload a new book (only for non-built-in books)
export async function saveBook(book: BookMeta): Promise<BookMeta> {
  // If it's a built-in book, just add it to local storage
  if (book.isBuiltIn) {
    const localBooks = JSON.parse(localStorage.getItem(KEY) || "[]");
    const updatedBooks = [...localBooks.filter((b: BookMeta) => b.id !== book.id), book];
    localStorage.setItem(KEY, JSON.stringify(updatedBooks));
    listeners.forEach(fn => fn());
    return book;
  }
  
  // For non-built-in books with PDF data, upload to server
  if (book.pdfData) {
    try {
      // Parse the base64 data
      const base64Data = book.pdfData.split(',')[1];
      const binaryData = atob(base64Data);
      
      // Convert to blob
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('pdfFile', blob, book.title + '.pdf');
      formData.append('title', book.title);
      formData.append('author', book.author || '');
      formData.append('userId', getUserId());
      
      // Upload to server
      const response = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload book');
      }
      
      const savedBook = await response.json();
      
      // Add URL for client use
      const bookWithUrl = {
        ...savedBook,
        url: `/api/books/${savedBook.id}/file`
      };
      
      listeners.forEach(fn => fn());
      return bookWithUrl;
    } catch (error) {
      console.error('Error uploading book:', error);
      throw error;
    }
  } else {
    throw new Error('No PDF data to upload');
  }
}

// Update book metadata (title, author)
export async function updateBook(id: string, patch: Partial<Pick<BookMeta,"title"|"author">>): Promise<void> {
  // Check if it's a built-in book (local storage only)
  const localBooks = JSON.parse(localStorage.getItem(KEY) || "[]");
  const isBuiltIn = localBooks.some((b: BookMeta) => b.id === id && b.isBuiltIn);
  
  if (isBuiltIn) {
    const i = localBooks.findIndex((b: BookMeta) => b.id === id);
    if (i === -1) return;
    localBooks[i] = { ...localBooks[i], ...patch };
    localStorage.setItem(KEY, JSON.stringify(localBooks));
    listeners.forEach(fn => fn());
    return;
  }
  
  // For server-side books, this would update on the server
  // API endpoint not implemented yet, so just notify listeners
  listeners.forEach(fn => fn());
}

// Delete a book
export async function deleteBook(id: string): Promise<BookMeta[]> {
  // Check if it's a built-in book (local storage only)
  const localBooks = JSON.parse(localStorage.getItem(KEY) || "[]");
  const isBuiltIn = localBooks.some((b: BookMeta) => b.id === id && b.isBuiltIn);
  
  if (isBuiltIn) {
    const filtered = localBooks.filter((book: BookMeta) => book.id !== id);
    localStorage.setItem(KEY, JSON.stringify(filtered));
    listeners.forEach(fn => fn());
    return getBooks();
  }
  
  // For server-side books, send a DELETE request
  try {
    const response = await fetch(`/api/books/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete book');
    }
    
    // Notify listeners and return updated book list
    listeners.forEach(fn => fn());
    return getBooks();
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
}

// Kept for compatibility, but not needed with server storage
export function getEstimatedLocalStorageSize(): number {
  return 0;
}