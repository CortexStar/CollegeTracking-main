import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import multer from "multer";
import { setupWebSocketServer } from "./websocket";

// Configure multer for storing uploads temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Limit file size to 50MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication has been permanently removed
  // All routes operate in guest mode
  // API routes for books
  app.get('/api/books', async (req, res) => {
    try {
      // Always use anonymous user ID since authentication is disabled
      const userId = "anonymous-user";
      const books = await storage.getUserBooks(userId);
      return res.status(200).json(books);
    } catch (error) {
      console.error('Error fetching books:', error);
      return res.status(500).json({ error: 'Failed to fetch books' });
    }
  });

  app.get('/api/books/:id', async (req, res) => {
    try {
      const bookId = req.params.id;
      const book = await storage.getBookById(bookId);
      
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      return res.status(200).json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      return res.status(500).json({ error: 'Failed to fetch book' });
    }
  });

  // Upload a new book
  app.post('/api/books/upload', upload.single('pdfFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }
      
      const { title, author } = req.body;
      // Always use anonymous user ID since authentication is disabled
      const userId = "anonymous-user";
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      const bookId = await storage.saveBookFile(
        req.file.buffer,
        req.file.originalname,
        userId,
        title,
        author || ""
      );
      
      const book = await storage.getBookById(bookId);
      return res.status(201).json(book);
    } catch (error) {
      console.error('Error uploading book:', error);
      return res.status(500).json({ error: 'Failed to upload book' });
    }
  });
  
  // Serve book file by ID
  app.get('/api/books/:id/file', async (req, res) => {
    try {
      const bookId = req.params.id;
      const book = await storage.getBookById(bookId);
      
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      // Set headers for PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${book.originalName}"`);
      
      try {
        // Get the file stream using the FileStore abstraction
        const fileStream = await storage.getBookStream(book.storedName);
        
        // Stream the file to the client
        fileStream.pipe(res);
      } catch (fileError) {
        console.error('Error getting book file stream:', fileError);
        return res.status(404).json({ error: 'Book file not found' });
      }
    } catch (error) {
      console.error('Error serving book file:', error);
      return res.status(500).json({ error: 'Failed to serve book file' });
    }
  });
  
  // Delete a book by ID
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const bookId = req.params.id;
      
      // Don't allow deleting the built-in book
      if (bookId === 'linear-algebra-default') {
        return res.status(403).json({ error: 'Cannot delete built-in book' });
      }
      
      const book = await storage.getBookById(bookId);
      
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      // Always use anonymous user ID since authentication is disabled
      const userId = "anonymous-user";
      
      // Check if the book belongs to the current user
      if (book.userId !== userId && book.userId !== "anonymous-user") {
        return res.status(403).json({ error: 'Cannot delete books that belong to other users' });
      }
      
      // Delete the book from the database and file storage
      await storage.deleteBook(bookId);
      
      return res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Error deleting book:', error);
      return res.status(500).json({ error: 'Failed to delete book' });
    }
  });

  // Explicitly serve the default PDF file (for backward compatibility)
  app.get('/linear-algebra-book.pdf', (req, res) => {
    const pdfPath = path.resolve(process.cwd(), 'public', 'linear-algebra-book.pdf');
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error serving PDF:', err);
        res.status(404).send('PDF file not found');
      }
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);

  return httpServer;
}
