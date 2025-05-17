/**
 * DiskStore
 * 
 * Local filesystem implementation of the FileStore interface.
 * Primarily used for development environments.
 * 
 * Features:
 * - Stores files in a configurable directory (/uploads by default)
 * - Automatically creates the directory if it doesn't exist
 * - Uses nanoid for generating unique filenames
 * - Preserves file extensions from original filenames
 * 
 * This implementation does not require any external services or API keys,
 * making it ideal for local development and testing.
 */

import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';
import { nanoid } from 'nanoid';
import { FileStore } from './interfaces';
export class DiskStore implements FileStore {
  private uploadDir: string;

  /**
   * Create a new DiskStore
   * @param uploadDir - Directory path where files will be stored
   */
  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
    // Create the upload directory if it doesn't exist
    (async () => {
      try {
        await fs.mkdir(this.uploadDir, { recursive: true });
      } catch (error) {
        console.error('Error creating upload directory:', error);
      }
    })();
  }

  /**
   * Store a file on the local disk
   * @param buf - Buffer containing file data
   * @param name - Original filename
   * @returns Promise resolving to the unique storage key
   */
  async put(buf: Buffer, name: string): Promise<string> {
    const fileExt = path.extname(name);
    const key = `${nanoid()}${fileExt}`;
    const filePath = path.join(this.uploadDir, key);
    
    try {
      await fs.writeFile(filePath, buf);
      return key;
    } catch (error) {
      console.error(`Error writing file ${key} to disk:`, error);
      throw error;
    }
  }

  /**
   * Get a file as a readable stream
   * @param key - Unique storage key
   * @returns Promise resolving to a readable stream
   */
  async get(key: string): Promise<Readable> {
    const filePath = path.join(this.uploadDir, key);
    
    try {
      // Verify the file exists before returning a stream
      await fs.access(filePath);
      return createReadStream(filePath);
    } catch (error) {
      console.error(`Error accessing file ${key}:`, error);
      throw new Error(`File ${key} not found or not accessible`);
    }
  }

  /**
   * Delete a file from disk
   * @param key - Unique storage key
   * @returns Promise resolving when file is deleted
   */
  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.log(`File ${key} not found or couldn't be accessed for deletion`);
      // We don't throw here since the file might already be gone
    }
  }
}