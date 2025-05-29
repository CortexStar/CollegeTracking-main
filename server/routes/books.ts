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
    const allBooks = await db.select().from(books);
    const booksWithUrls = allBooks.map((book: SelectBook) => ({
      ...book,
      url: `/uploads/${book.filePath}`
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
      url: `/uploads/${book.filePath}`
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

      const userId = req.userId ?? "anonymous";
      
      // Use the stored path from the upload middleware
      const filePath = req.file.storedPath || path.relative(process.cwd(), req.file.path);

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

      // Add the URL to the response
      const responseData = {
        ...inserted,
        url: `/uploads/${filePath}`
      };

      res.status(201).json({ success: true, data: responseData });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });
});

export default router; 