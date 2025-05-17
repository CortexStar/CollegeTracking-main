# File Storage Architecture

## Overview

The file storage system is designed with scalability, flexibility, and maintainability in mind. It provides a unified interface for storing, retrieving, and deleting files, regardless of the underlying storage mechanism (local disk or cloud storage).

## System Components

### 1. Storage Service Layer (`storage.ts`)

This is the main entry point for all file operations in the application. It provides high-level methods such as:
- `saveBookFile`: Stores a PDF file and creates a database record
- `getUserBooks`: Retrieves all books for a user 
- `getBookById`: Gets a specific book by ID
- `getBookStream`: Returns a stream of the book file
- `deleteBook`: Removes both the file and database record

This layer abstracts away the storage implementation details from the rest of the application.

### 2. FileStore Abstraction (`interfaces.ts`)

Defines a common interface that all storage implementations must implement:
- `put`: Stores a file and returns a unique key
- `get`: Retrieves a file as a readable stream
- `delete`: Removes a file

### 3. Storage Implementations

#### Local Disk Storage (`disk-store.ts`)
- Uses the local filesystem for storing files
- Primarily used for development environments
- Files are stored in the `/uploads` directory

#### S3 Cloud Storage (`s3-store.ts`)
- Uses AWS S3 for storing files
- Used for production environments
- Requires AWS credentials and bucket configuration

### 4. Factory Pattern (`index.ts`)

Provides a factory function that creates the appropriate FileStore implementation based on the environment:
- Production environment: S3Store (falls back to DiskStore if AWS configuration is missing)
- Development environment: DiskStore

## Flow Diagram

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  API Routes   │────▶│ Storage Layer │────▶│   FileStore   │
│  (routes.ts)  │     │ (storage.ts)  │     │  Abstraction  │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
                    ┌────────────────────────────────────────────┐
                    │                                            │
              ┌─────┴─────┐                            ┌─────────┴────┐
              │  DiskStore │                            │   S3Store    │
              │(disk-store.ts)                          │ (s3-store.ts)│
              └───────────┘                            └──────────────┘
```

## Database Integration

The storage system integrates with the database (PostgreSQL) to store metadata about files:
- The `books` table contains records with fields like `id`, `title`, `author`, `storedName`, etc.
- The actual file data is stored in the file storage system (disk or S3)
- The database record contains a reference to the stored file name

## Error Handling

The storage system includes comprehensive error handling:
- Each method includes try/catch blocks to handle errors
- All errors are logged with contextual information
- Errors are propagated up to the API layer for consistent response handling

## Scaling Considerations

This architecture supports scaling in several ways:
- Separation of concerns allows independent scaling of components
- S3 implementation supports virtually unlimited storage capacity
- Streaming API minimizes memory usage for large files
- Consistent interface allows for adding new storage backends (e.g., Google Cloud Storage, Azure Blob Storage)