/**
 * S3Store
 * 
 * AWS S3 implementation of the FileStore interface for production environments.
 * 
 * Required AWS environment variables:
 * - AWS_REGION: The AWS region where the S3 bucket is located (e.g., 'us-east-1')
 * - AWS_ACCESS_KEY_ID: AWS access key with S3 permissions
 * - AWS_SECRET_ACCESS_KEY: AWS secret for the access key
 * - AWS_BUCKET_NAME: Name of the S3 bucket to use for storage
 * 
 * This implementation requires the @aws-sdk/client-s3 package to be installed.
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { nanoid } from 'nanoid';
import path from 'path';
import { FileStore } from './interfaces';
export class S3Store implements FileStore {
  private s3Client: S3Client;
  private bucketName: string;
  
  /**
   * Create a new S3Store
   * @param bucketName - Name of the S3 bucket
   * @param region - AWS region (optional, defaults to AWS_REGION env var)
   */
  constructor(bucketName: string, region?: string) {
    this.bucketName = bucketName;
    this.s3Client = new S3Client({ 
      region: region || process.env.AWS_REGION || 'us-east-1'
    });
  }
  
  /**
   * Store a file in S3
   * @param buf - Buffer containing file data
   * @param name - Original filename
   * @returns Promise resolving to the unique storage key
   */
  async put(buf: Buffer, name: string): Promise<string> {
    const fileExt = path.extname(name);
    const key = `${nanoid()}${fileExt}`;
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buf,
        ContentType: this.getContentType(fileExt)
      });
      
      await this.s3Client.send(command);
      return key;
    } catch (error) {
      console.error(`Error uploading file ${key} to S3:`, error);
      throw error;
    }
  }
  
  /**
   * Get a file as a readable stream
   * @param key - Unique storage key
   * @returns Promise resolving to a readable stream
   */
  async get(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error(`No body returned for S3 object ${key}`);
      }
      
      return response.Body as Readable;
    } catch (error) {
      console.error(`Error retrieving file ${key} from S3:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a file from S3
   * @param key - Unique storage key
   * @returns Promise resolving when file is deleted
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Error deleting file ${key} from S3:`, error);
      throw error;
    }
  }
  
  /**
   * Helper method to determine content type from file extension
   * @param ext - File extension
   * @returns Content type string
   */
  private getContentType(ext: string): string {
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}