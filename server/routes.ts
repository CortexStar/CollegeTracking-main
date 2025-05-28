import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import multer from "multer";
import { setupWebSocketServer } from "./websocket";
import express from "express";
import fs from "fs/promises";
import { fileUploadManager } from "./fileUploadManager";
import { env } from "../shared/env";

// Configure multer for storing uploads temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = (env.ALLOWED_FILE_TYPES || "application/pdf").split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed. Got ${file.mimetype}`));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const userId = "anonymous-user";

  app.get('/api/books', async (req, res) => {
    try {
      const booksMeta = await storage.getUserBooksAsMeta(userId);
      return res.status(200).json(booksMeta);
    } catch (error) {
      console.error('Error in GET /api/books:', error.message, error.stack ? `\nStack: ${error.stack}` : '');
      return res.status(500).json({ error: 'Failed to fetch books', details: error.message });
    }
  });

  app.get('/api/books/:id', async (req, res) => {
    try {
      const bookId = req.params.id;
      const bookMeta = await storage.getBookByIdAsMeta(bookId, userId);
      if (!bookMeta) {
        return res.status(404).json({ error: 'Book not found or not active' });
      }
      return res.status(200).json(bookMeta);
    } catch (error) {
      console.error(`Error in GET /api/books/${req.params.id}:`, error.message, error.stack ? `\nStack: ${error.stack}` : '');
      return res.status(500).json({ error: 'Failed to fetch book', details: error.message });
    }
  });

  app.post('/api/books/upload', upload.single('pdfFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }
      
      const { title, author } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      const dbBook = await storage.saveBookFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId,
        title,
        author || ""
      );
      
      const bookMeta = await storage.getBookByIdAsMeta(dbBook.id, userId);
      if (!bookMeta) {
        throw new Error("Failed to retrieve book as BookMeta after saving.");
      }
      return res.status(201).json(bookMeta);
    } catch (error) {
      console.error('Error in POST /api/books/upload:', error.message, error.stack ? `\nStack: ${error.stack}` : '');
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload book';
      return res.status(500).json({ error: errorMessage, details: errorMessage });
    }
  });

  app.put('/api/books/:id', async (req, res) => {
    try {
      const bookId = req.params.id;
      const { title, author, metadataJson } = req.body;
      
      const updates: Partial<{ title: string; author: string; metadataJson: Record<string, any> }> = {};
      if (title !== undefined) updates.title = title;
      if (author !== undefined) updates.author = author;
      if (metadataJson !== undefined) updates.metadataJson = metadataJson;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No update fields provided' });
      }

      const updatedDbBook = await storage.updateBookMetadata(bookId, userId, updates);
      if (!updatedDbBook) {
        return res.status(404).json({ error: 'Book not found, not owned, or not active' });
      }
      const bookMeta = await storage.getBookByIdAsMeta(updatedDbBook.id, userId);
      return res.status(200).json(bookMeta);
    } catch (error) {
      console.error(`Error in PUT /api/books/${req.params.id}:`, error.message, error.stack ? `\nStack: ${error.stack}` : '');
      const errorMessage = error instanceof Error ? error.message : 'Failed to update book';
      return res.status(500).json({ error: errorMessage, details: errorMessage });
    }
  });
  
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const bookId = req.params.id;
      const success = await storage.softDeleteBook(bookId, userId);
      if (!success) {
        return res.status(404).json({ error: 'Book not found or not authorized for deletion' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error(`Error in DELETE /api/books/${req.params.id}:`, error.message, error.stack ? `\nStack: ${error.stack}` : '');
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete book';
      return res.status(500).json({ error: errorMessage, details: errorMessage });
    }
  });

  app.get('/api/files/:filePath(*)', async (req, res) => {
    const requestedRelativePath = req.params.filePath;
    if (!requestedRelativePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    try {
      const decodedPath = decodeURIComponent(requestedRelativePath);
      const fullDiskPath = fileUploadManager.getFullDiskPath(decodedPath);
      
      const baseUploadDirResolved = path.resolve(env.UPLOAD_DIR || './uploads');
      const requestedFileResolved = path.resolve(fullDiskPath);

      if (!requestedFileResolved.startsWith(baseUploadDirResolved)) {
        console.warn(`Attempt to access file outside UPLOAD_DIR: ${decodedPath}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      await fs.access(fullDiskPath);
      const fileStats = await fs.stat(fullDiskPath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', fileStats.size.toString());
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(decodedPath)}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); 
      
      const fileStream = (await fs.open(fullDiskPath)).createReadStream();
      fileStream.pipe(res);

    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      console.error(`Error serving file ${requestedRelativePath}:`, error.message, error.stack ? `\nStack: ${error.stack}` : '');
      return res.status(500).json({ error: 'Internal server error while serving file' });
    }
  });

  

  const httpServer = createServer(app);
  setupWebSocketServer(httpServer);
  return httpServer;
}
