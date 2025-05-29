export interface BookMeta {
  id: string;
  title: string;
  author?: string;
  url?: string;
  pdfData?: string;
  pdfFileContent?: File;
  storedName?: string;
  originalName?: string;
  isBuiltIn?: boolean;
  fileSize?: number;
  uploadDate?: Date;
  externalLink?: string;
  isActive?: boolean;
  updatedAt?: Date;
}

export interface StorageAdapter {
  saveBook(book: BookMeta): Promise<BookMeta>;
  getBook(id: string): Promise<BookMeta | null>;
  getBooks(): Promise<BookMeta[]>;
  updateBook(id: string, updates: Partial<BookMeta>): Promise<BookMeta>;
  deleteBook(id: string): Promise<void>;
} 