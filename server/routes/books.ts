import { Router, Request, Response } from "express";
import { uploadPdf } from "../middlewares/upload";  // Note: adjusted path to match our directory structure
import { db } from "../db/client";      // your pre‑configured Drizzle client
import { books, type SelectBook } from "../../shared/schema";  // Note: adjusted path to match our schema location
import { eq } from "drizzle-orm";
import path from "node:path";

interface UploadRequest extends Request {
  userId?: string;                      // populated by auth middleware
  file?: Express.Multer.File & {
    storedPath?: string;
  };
}

const router = Router();

// Get all books
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get ALL books regardless of user ID
    const allBooks = await db.select().from(books);
    const booksWithUrls = allBooks.map((book: SelectBook) => ({
      ...book,
      url: `/uploads/${book.filePath.replace(/\\/g, '/')}`
    }));
    res.json(booksWithUrls);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch books',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a single book
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Get ANY book by ID regardless of user
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, req.params.id));

    if (!book) {
      return res.status(404).json({ 
        success: false, 
        error: 'Book not found' 
      });
    }

    const bookWithUrl: SelectBook & { url: string } = {
      ...book as SelectBook,
      url: `/uploads/${book.filePath.replace(/\\/g, '/')}`
    };

    res.json(bookWithUrl);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch book',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload a new book
router.post("/upload", (req: UploadRequest, res: Response) => {
  uploadPdf(req, res, async (err: any) => {
    try {
      if (err) throw err;
      if (!req.file) throw new Error("No file provided");

      const { title, author } = req.body;
      if (!title) throw new Error("Title is required");

      const userId = req.userId ?? "anonymous-user";
      
      // Use the stored path from the upload middleware
      const filePath = req.file.storedPath || path.relative(process.cwd(), req.file.path);

      try {
        const [inserted] = await db
          .insert(books)
          .values({
            title,
            author,
            filePath,
            originalFilename: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            userId,
          })
          .returning();

        // Add the URL to the response with forward slashes for web URLs
        const responseData = {
          ...inserted,
          url: `/uploads/${filePath.replace(/\\/g, '/')}`
        };

        res.status(201).json(responseData);
      } catch (dbErr) {
        console.error('DB insert failed:', dbErr);
        res.status(500).json({ error: 'Database insert failed' });
      }
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });
});

// Delete a book
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    console.log(`Attempting to delete book ${bookId}`);
    
    // Simple approach: just delete the book if it exists, no authorization checks
    const result = await db
      .delete(books)
      .where(eq(books.id, bookId))
      .returning({ id: books.id });

    if (result.length === 0) {
      console.log(`Delete failed: book with ID ${bookId} not found in database`);
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log(`Successfully deleted book ${bookId}`);
    res.status(204).send();
  } catch (error) {
    console.error(`Error in DELETE /api/books/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to delete book',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 