import multer, { FileFilterCallback } from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { Request } from "express";

// Use absolute path for uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads", "books");
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE ?? 50 * 1024 * 1024);
const ALLOWED_MIME = new Set(
  (process.env.ALLOWED_FILE_TYPES ?? "application/pdf")
    .split(",")
    .map(t => t.trim())
);

// ensure directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    const filename = `${uuid}${ext}`;
    
    // For URL construction, we just need the filename since files are stored directly in UPLOAD_DIR
    // which corresponds to /uploads/books in the URL path
    (file as any).storedPath = `books/${filename}`;
    
    cb(null, filename);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }
  cb(null, true);
}

export const uploadPdf = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single("pdfFile");          // Changed from "file" to "pdfFile" 