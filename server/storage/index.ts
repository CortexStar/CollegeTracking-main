import path from 'path';
import { FileStore } from './interfaces';
import { DiskStore } from './disk-store';
import { S3Store } from './s3-store';
import { env } from '../../shared/env';

// Constants
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Create and return the appropriate FileStore implementation based on environment
 * This provides a simple dependency injection mechanism
 */
export function createFileStore(): FileStore {
  // Production environment - use S3
  if (env.NODE_ENV === 'production') {
    // Check for required AWS configuration
    const bucketName = process.env.AWS_BUCKET_NAME;
    
    if (!bucketName) {
      console.warn('AWS_BUCKET_NAME not provided for production environment. Falling back to local disk storage.');
      return new DiskStore(UPLOAD_DIR);
    }
    
    return new S3Store(bucketName);
  }
  
  // Development environment - use local disk
  return new DiskStore(UPLOAD_DIR);
}

// Export a singleton instance of the FileStore
export const fileStore: FileStore = createFileStore();

// Re-export types as needed
export type { FileStore } from './interfaces';