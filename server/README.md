# Server

The backend Express.js server that handles API requests, authentication, and file storage.

## Overview

This server provides:
- RESTful API endpoints for book management
- Authentication via Passport.js with session-based auth
- File storage abstraction with support for local disk and S3
- WebSocket server for real-time updates

## Directory Structure

- `/auth.ts` - Authentication setup and routes
- `/index.ts` - Server entry point
- `/routes.ts` - API route definitions
- `/storage.ts` - Book file storage service
- `/vite.ts` - Integration with Vite for development
- `/websocket.ts` - WebSocket server implementation
- `/middlewares/` - Express middleware components
- `/storage/` - Storage implementation abstractions

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Secret for session cookies | Random in dev |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `AWS_REGION` | AWS region for S3 storage | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | S3 storage only |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | S3 storage only |
| `AWS_BUCKET_NAME` | S3 bucket name | S3 storage only |
| `REDIS_URL` | Redis connection string | Graceful fallback if missing |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Authenticate a user |
| POST | `/api/logout` | Log out the current user |
| GET | `/api/user` | Get the current authenticated user |
| GET | `/api/books` | Get all books for a user |
| GET | `/api/books/:id` | Get a specific book |
| GET | `/api/books/:id/file` | Get a book's PDF file |
| POST | `/api/books/upload` | Upload a new book |
| DELETE | `/api/books/:id` | Delete a book |

## Storage Abstractions

The server uses a pluggable storage system with implementations for:
- Local disk storage (development)
- AWS S3 storage (production)

The implementation is selected based on environment variables.