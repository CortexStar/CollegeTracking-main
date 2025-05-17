import { Readable } from 'stream';

/**
 * Interface for file storage implementations
 * Allows for different backend storage mechanisms (local disk, S3, etc.)
 */
export interface FileStore {
  /**
   * Store a file in the storage backend
   * @param buf - Buffer containing file data
   * @param name - Original filename (used for extracting extension, etc.)
   * @returns Promise resolving to the unique storage key for the file
   */
  put(buf: Buffer, name: string): Promise<string>;
  
  /**
   * Retrieve a file as a readable stream
   * @param key - Unique storage key for the file
   * @returns Promise resolving to a readable stream of file data
   */
  get(key: string): Promise<Readable>;
  
  /**
   * Delete a file from the storage backend
   * @param key - Unique storage key for the file
   * @returns Promise resolving when file is deleted
   */
  delete(key: string): Promise<void>;
}