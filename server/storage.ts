/**
 * Storage Service
 * 
 * Provides an interface for managing book files (PDFs) in the application.
 * Uses the FileStore abstraction for actual file storage, which allows
 * switching between storage backends (local disk, S3, etc.) without
 * changing the application code.
 */

import { db } from "../db";
import { books, type Book as DbBook } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { fileUploadManager, type UploadResult } from "./fileUploadManager";
import type { BookMeta } from "../../client/src/types/book";

// Helper function to convert DB record to BookMeta for frontend
function dbBookToBookMeta(dbBook: DbBook): BookMeta {
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author || undefined,
    url: fileUploadManager.getFileServeUrl(dbBook.filePath),
    originalName: dbBook.originalFilename,
    fileSize: dbBook.fileSize,
    uploadDate: dbBook.createdAt,
    isBuiltIn: dbBook.isBuiltIn,
    storedName: dbBook.filePath,
  };
}

export const storage = {
  // // REMOVED saveBookFile function - no longer saves uploaded PDF files
  // async saveBookFile(
  //   fileBuffer: Buffer,
  //   originalNameFromMulter: string,
  //   mimeTypeFromMulter: string,
  //   userId: string,
  //   title: string,
  //   author: string = "",
  // ): Promise<DbBook> {
  //   const bookId = nanoid();

  //   // 1. Save file to disk using FileUploadManager
  //   const uploadResult: UploadResult = await fileUploadManager.saveUploadedFile(
  //     fileBuffer,
  //     originalNameFromMulter,
  //     mimeTypeFromMulter
  //   );

  //   // 2. Insert the book record into the database
  //   const newBookData = {
  //     id: bookId,
  //     userId,
  //     title,
  //     author,
  //     filePath: uploadResult.filePath,
  //     originalFilename: uploadResult.originalFilename,
  //     fileSize: uploadResult.fileSize,
  //     mimeType: uploadResult.mimeType,
  //   };

  //   const insertedBooks = await db.insert(books).values(newBookData).returning();
  //   if (insertedBooks.length === 0) {
  //     throw new Error("Failed to save book metadata to database after file upload.");
  //   }
  //   return insertedBooks[0];
  // },

  async getUserBooks(userId: string): Promise<DbBook[]> {
    return await db.query.books.findMany({
      where: eq(books.userId, userId),
      orderBy: (booksTable, { desc }) => [desc(booksTable.createdAt)],
    });
  },

  async getBookById(id: string, userId?: string): Promise<DbBook | null> {
    const conditions = [eq(books.id, id), eq(books.isActive, true)];
    if (userId) {
      conditions.push(eq(books.userId, userId));
    }
    const book = await db.query.books.findFirst({
      where: and(...conditions),
    });
    return book || null;
  },

  async getBookDbRecordForFile(id: string): Promise<DbBook | null> {
    const book = await db.query.books.findFirst({
        where: and(eq(books.id, id), eq(books.isActive, true))
    });
    return book || null;
  },
  
  async getUserBooksAsMeta(userId: string): Promise<BookMeta[]> {
    const dbBooks = await this.getUserBooks(userId);
    return dbBooks.map(dbBookToBookMeta);
  },

  async getBookByIdAsMeta(id: string, userId?: string): Promise<BookMeta | null> {
    const dbBook = await this.getBookById(id, userId);
    return dbBook ? dbBookToBookMeta(dbBook) : null;
  },

  async updateBookMetadata(
    id: string,
    userId: string,
    updates: Partial<{ title: string; author: string; metadataJson: Record<string, any> }>
  ): Promise<DbBook | null> {
    const bookToUpdate = await db.query.books.findFirst({
      where: and(eq(books.id, id), eq(books.userId, userId), eq(books.isActive, true))
    });

    if (!bookToUpdate) {
      return null;
    }

    const updateData: Partial<DbBook> = { ...updates, updatedAt: new Date() };
    
    const updatedBooks = await db.update(books)
      .set(updateData)
      .where(eq(books.id, id))
      .returning();
    
    return updatedBooks[0] || null;
  },

  async softDeleteBook(id: string, userId: string): Promise<boolean> {
    try {
      // Since the current database doesn't have isActive field, just delete the record
      // First check if the book exists and belongs to the user
      const book = await db.query.books.findFirst({
        where: and(eq(books.id, id), eq(books.userId, userId)),
      });
      
      if (!book) {
        return false;
      }
      
      // Don't delete built-in books
      if (book.isBuiltIn) {
        return false;
      }
      
      // Delete the book record
      const result = await db.delete(books)
        .where(and(eq(books.id, id), eq(books.userId, userId)))
        .returning({ id: books.id });

      return result.length > 0;
    } catch (error) {
      console.error('Error in softDeleteBook:', error);
      return false;
    }
  },

  async storeUserPreference(userId: string, theme: string): Promise<void> {
    // console.log(`Storing user ${userId} preference: ${theme}`);
  },
  async getUserPreference(userId: string): Promise<string | null> {
    return null;
  }
};
