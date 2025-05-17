# File Storage Abstraction

## Overview

This directory contains the implementation of a file storage abstraction layer for the application. The abstraction allows the application to seamlessly switch between different storage backends (e.g., local disk, AWS S3) without changing the application code.

## Architecture

The storage system is built around the following components:

### `interfaces.ts`

Defines the `FileStore` interface that all storage implementations must adhere to:

- `put(buf: Buffer, name: string): Promise<string>` - Stores a file and returns a unique key
- `get(key: string): Promise<Readable>` - Retrieves a file as a readable stream
- `delete(key: string): Promise<void>` - Deletes a file

### `disk-store.ts`

Local filesystem implementation of the `FileStore` interface, used primarily for development.

### `s3-store.ts`

AWS S3 implementation of the `FileStore` interface, used for production environments.

### `index.ts`

Factory function that creates the appropriate `FileStore` implementation based on the environment:
- Uses `DiskStore` for development
- Uses `S3Store` for production, falling back to `DiskStore` if AWS configuration is missing

## AWS Configuration

The S3 storage implementation requires the following environment variables:

- `AWS_REGION` - AWS region for S3 (e.g., "us-east-1")
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_BUCKET_NAME` - S3 bucket name

## Usage

```typescript
// Import the fileStore singleton
import { fileStore } from "./storage";

// Store a file
const key = await fileStore.put(buffer, filename);

// Retrieve a file
const stream = await fileStore.get(key);

// Delete a file
await fileStore.delete(key);
```

## Benefits

- **Abstraction**: Uniform API regardless of the storage backend
- **Testability**: Easy to mock and test
- **Flexibility**: Switch between storage backends without changing application code
- **Scalability**: Start with local storage during development, seamlessly transition to S3 for production
- **Maintainability**: Clear separation of concerns, each implementation focused on a single responsibility