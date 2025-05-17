/**
 * Storage Service
 * 
 * Provides an interface for managing book files (PDFs) in the application.
 * Uses the FileStore abstraction for actual file storage, which allows
 * switching between storage backends (local disk, S3, etc.) without
 * changing the application code.
 */

import { db } from "../db";
import { books } from "../shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import path from 'path';
import { fileStore } from "./storage/index";

export const storage = {
  // Book/PDF storage methods
  async saveBookFile(fileBuffer: Buffer, originalName: string, userId: string, title: string, author: string = ""): Promise<string> {
    // Generate unique ID for the book
    const bookId = nanoid();
    
    try {
      // Store the file using the FileStore abstraction
      const storedName = await fileStore.put(fileBuffer, originalName);
      
      // Insert the book record into the database
      await db.insert(books).values({
        id: bookId,
        userId,
        title,
        author,
        storedName,
        originalName,
        isBuiltIn: false,
      });
      
      return bookId;
    } catch (error) {
      console.error('Error saving book file:', error);
      throw error; // Re-throw to be caught by global error handler
    }
  },
  
  async getUserBooks(userId: string) {
    return await db.query.books.findMany({
      where: eq(books.userId, userId),
      orderBy: (books, { desc }) => [desc(books.uploadedAt)]
    });
  },
  
  async getBookById(id: string) {
    return await db.query.books.findFirst({
      where: eq(books.id, id)
    });
  },
  
  async getBookStream(storedName: string): Promise<NodeJS.ReadableStream> {
    try {
      // Get a readable stream for the book file using the FileStore abstraction
      return await fileStore.get(storedName);
    } catch (error) {
      console.error(`Error getting book stream for ${storedName}:`, error);
      throw error;
    }
  },
  
  async deleteBook(id: string): Promise<void> {
    try {
      // First get the book to find its file
      const book = await db.query.books.findFirst({
        where: eq(books.id, id)
      });
      
      if (!book) {
        throw new Error('Book not found');
      }
      
      try {
        // Delete the file using the FileStore abstraction
        await fileStore.delete(book.storedName);
      } catch (fileError) {
        // File doesn't exist or couldn't be accessed, just log and continue
        console.log(`File ${book.storedName} not found or couldn't be accessed`);
      }
      
      // Delete the book record from the database
      await db.delete(books).where(eq(books.id, id));
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error; // Re-throw to be caught by global error handler
    }
  },
  
  // For user session management
  async storeUserPreference(userId: string, theme: string): Promise<void> {
    // This would store a user preference in the database
    // console.log(`Storing user ${userId} preference: ${theme}`);
  },
  
  async getUserPreference(userId: string): Promise<string | null> {
    // This would retrieve a user preference from the database
    return null;
  }
};
