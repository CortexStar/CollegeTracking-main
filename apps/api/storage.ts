import { db } from "@db";
import { books } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

// Ensure the uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const storage = {
  // Book/PDF storage methods
  async saveBookFile(fileBuffer: Buffer, originalName: string, userId: string, title: string, author: string = ""): Promise<string> {
    // Generate unique IDs for the book and filename
    const bookId = nanoid();
    const fileExt = path.extname(originalName);
    const storedName = `${nanoid()}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, storedName);
    
    // Write the file to disk
    fs.writeFileSync(filePath, fileBuffer);
    
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
  
  getBookFilePath(storedName: string): string {
    return path.join(UPLOAD_DIR, storedName);
  },
  
  async deleteBook(id: string): Promise<void> {
    // First get the book to find its file
    const book = await db.query.books.findFirst({
      where: eq(books.id, id)
    });
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    // Delete the file from disk if it exists
    const filePath = path.join(UPLOAD_DIR, book.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the book record from the database
    await db.delete(books).where(eq(books.id, id));
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
