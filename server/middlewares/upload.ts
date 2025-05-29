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
    // Create a date-based subdirectory structure
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    
    // Create the year/month subdirectories
    const yearDir = path.join(UPLOAD_DIR, String(year));
    const monthDir = path.join(yearDir, month);
    fs.mkdir(monthDir, { recursive: true })
      .then(() => {
        const filename = `${uuid}${ext}`;
        const relativePath = path.join(String(year), month, filename);
        // Store the relative path on the request for later use
        (file as any).storedPath = relativePath;
        cb(null, filename);
      })
      .catch(err => cb(err));
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
}).single("file");          // expecting <input name="file" /> 