import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../shared/env'; // To get UPLOAD_DIR

export interface UploadResult {
  filePath: string; // Relative path, e.g., books/2024/05/uuid-name.pdf
  originalFilename: string;
  fullPath: string; // Full disk path
  fileSize: number;
  mimeType: string;
}

export class FileUploadManager {
  private baseUploadDir: string;
  private booksDirName = 'books';
  private tempDirName = 'temp'; // For potential future use

  constructor() {
    this.baseUploadDir = path.resolve(env.UPLOAD_DIR || './uploads');
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  public async getBookStoragePath(): Promise<{ year: string; month: string; fullDirectoryPath: string; relativeDirectoryPath: string }> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    const relativeDirectoryPath = path.join(this.booksDirName, year, month);
    const fullDirectoryPath = path.join(this.baseUploadDir, relativeDirectoryPath);
    
    await this.ensureDirectory(fullDirectoryPath);
    return { year, month, fullDirectoryPath, relativeDirectoryPath };
  }

  public async ensureTempDirectory(): Promise<string> {
    const tempDirPath = path.join(this.baseUploadDir, this.tempDirName);
    await this.ensureDirectory(tempDirPath);
    return tempDirPath;
  }

  async saveUploadedFile(fileBuffer: Buffer, originalNameFromMulter: string, mimeTypeFromMulter: string): Promise<UploadResult> {
    const { fullDirectoryPath, relativeDirectoryPath } = await this.getBookStoragePath();

    // Validate file type (can add more robust checks if needed)
    // For now, we trust multer's fileFilter and the mimeTypeFromMulter
    const allowedMimeTypes = (env.ALLOWED_FILE_TYPES || 'application/pdf').split(',');
    if (!allowedMimeTypes.includes(mimeTypeFromMulter)) {
      throw new Error(`File type ${mimeTypeFromMulter} is not allowed.`);
    }

    const maxSize = parseInt(env.MAX_FILE_SIZE || '50485760'); // 50MB default
    if (fileBuffer.length > maxSize) {
      throw new Error(`File size (${fileBuffer.length} bytes) exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
    }

    const fileId = uuidv4();
    // Sanitize originalName to prevent path traversal or invalid characters if used directly in filename
    const sanitizedOriginalName = path.basename(originalNameFromMulter).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFileName = `${fileId}-${sanitizedOriginalName}`;

    const relativeFilePath = path.join(relativeDirectoryPath, uniqueFileName);
    const fullDiskPath = path.join(fullDirectoryPath, uniqueFileName);

    await fs.writeFile(fullDiskPath, fileBuffer);

    return {
      filePath: relativeFilePath, // Store this relative path in DB
      originalFilename: originalNameFromMulter, // Store the original name from upload
      fullPath: fullDiskPath,
      fileSize: fileBuffer.length,
      mimeType: mimeTypeFromMulter,
    };
  }

  async deleteFile(relativeFilePath: string): Promise<void> {
    if (!relativeFilePath) {
      console.warn('Attempted to delete file with empty/null path.');
      return;
    }
    try {
      const fullPath = path.join(this.baseUploadDir, relativeFilePath);
      // Security check: Ensure the path is within the base upload directory
      if (!path.resolve(fullPath).startsWith(path.resolve(this.baseUploadDir))) {
        console.error(`Attempt to delete file outside upload directory: ${relativeFilePath}`);
        throw new Error('Access denied for file deletion.');
      }
      await fs.unlink(fullPath);
      console.log(`Successfully deleted file: ${fullPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`File not found, presumed already deleted: ${relativeFilePath}`);
      } else {
        console.error(`Error deleting file ${relativeFilePath}:`, error);
        // Don't re-throw if we want to allow the DB operation to succeed even if file deletion fails
      }
    }
  }

  // Generates a URL that the client can use to request the file via our file-serving API endpoint
  getFileServeUrl(relativeFilePath: string): string {
    // The actual API endpoint will be like /api/files/books/2024/05/uuid-name.pdf
    // The `relativeFilePath` already contains the 'books/YYYY/MM/filename.pdf' part.
    return `/api/files/${encodeURIComponent(relativeFilePath)}`;
  }

  getFullDiskPath(relativeFilePath: string): string {
    return path.join(this.baseUploadDir, relativeFilePath);
  }
}

export const fileUploadManager = new FileUploadManager(); 