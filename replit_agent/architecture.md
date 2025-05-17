# Architecture Overview

## 1. Overview

This repository contains a full-stack web application built with a React frontend and an Express.js backend. The application serves as an educational platform primarily focused on linear algebra content, allowing users to:

- Upload and view PDF textbooks
- Track progress through problem sets
- Manage solutions and lecture links
- View course materials organized by chapters and sections
- Track and forecast academic grades

The architecture follows a monorepo structure with clear separation between frontend and backend components. The application is designed to run in a Replit environment, with specific configurations for that platform.

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a modern web application architecture with a monorepo structure and three main layers:

1. **Frontend Layer**: React-based client application with UI components
2. **Backend Layer**: Express.js API server handling business logic and data operations
3. **Data Layer**: PostgreSQL database using Drizzle ORM for data access

```
┌───────────────────────────────────────────────────────────────┐
│                      pnpm Monorepo                            │
│                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐  │
│  │    client   │────▶│    server   │────▶│      db         │  │
│  │  (React UI) │◀────│  (Express)  │◀────│  (Drizzle ORM)  │  │
│  └─────────────┘     └─────────────┘     └─────────────────┘  │
│        │                    │                    │             │
│        ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐  │
│  │   shared    │     │  packages/  │     │  PostgreSQL DB  │  │
│  │   (Types)   │     │   queues    │────▶│  (Data Storage) │  │
│  └─────────────┘     └─────────────┘     └─────────────────┘  │
│                             │                                  │
│                             ▼                                  │
│                      ┌─────────────────┐                       │
│                      │   File Storage  │                       │
│                      │ (Local/S3 Files)│                       │
│                      └─────────────────┘                       │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Client-Server Communication

- **HTTP REST API**: Primary communication between client and server
- **WebSockets**: Real-time updates for certain features

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built with React and follows a component-based architecture:

- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: 
  - React Context API for global state (themes, course information)
  - React Query for server state and API calls
  - Local component state for UI-specific state
- **UI Components**: Custom components built on top of Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with theming support

Key frontend directories:
- `/client/src/components`: Reusable UI components
- `/client/src/pages`: Page components corresponding to routes
- `/client/src/hooks`: Custom React hooks for shared logic
- `/client/src/lib`: Utility functions and API clients

### 3.2 Backend Architecture

The backend is built with Express.js and follows a modular architecture:

- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints
- **Authentication**: Session-based authentication with Passport.js
- **File Handling**: Abstracted file storage system supporting both local disk and S3 storage
- **Real-time Communication**: WebSocket server for live updates

Key backend directories:
- `/server`: Main Express.js application
- `/server/storage`: File storage abstraction
- `/server/middlewares`: Express middleware functions
- `/packages`: Shared functionality grouped into logical packages

### 3.3 Database Architecture

- **Database**: PostgreSQL via Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM for type-safe database access
- **Schema Management**: Schema defined in TypeScript with Drizzle schema builder
- **Migrations**: Using Drizzle Kit for database schema migrations

### 3.4 Storage Architecture

The application includes an abstracted file storage system:

- **Interface**: Unified `FileStore` interface for file operations
- **Implementations**:
  - `DiskStore`: Local filesystem storage for development
  - `S3Store`: AWS S3 storage for production
- **Factory Pattern**: Runtime selection of appropriate storage implementation

## 4. Data Flow

### 4.1 Book Management Flow

1. User uploads a PDF through the frontend
2. Client sends the file to the server via multipart form data
3. Server validates and processes the file
4. Server stores the file in the configured storage system (local or S3)
5. Server creates a record in the database with metadata
6. Client receives confirmation and updates the UI

### 4.2 Authentication Flow

1. User submits login/registration form
2. Server validates credentials
3. On success, server creates a session and stores session data
4. Client receives session cookie for subsequent authenticated requests

## 5. External Dependencies

### 5.1 Core Technologies

- **React**: Frontend UI library
- **Express.js**: Backend web framework
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Database ORM
- **TypeScript**: Programming language for type safety

### 5.2 External Services

- **AWS S3**: Optional cloud storage for production file storage
- **Neon Database**: Serverless PostgreSQL provider

### 5.3 Key Libraries

- **Frontend**:
  - Radix UI: Accessible UI primitives
  - Tailwind CSS: Utility-first CSS framework
  - React Query: Data fetching and cache management
  - Wouter: Routing library

- **Backend**:
  - Passport.js: Authentication middleware
  - Multer: File upload handling
  - AWS SDK: For S3 integration
  - ws: WebSocket server implementation

## 6. Deployment Strategy

The application is configured for deployment in a Replit environment:

- **Development**: 
  - Uses Vite dev server for frontend
  - Runs backend server with hot reload using tsx
  - Uses local disk storage for files

- **Production**:
  - Builds frontend with Vite
  - Bundles backend with esbuild
  - Configures for serverless deployment
  - Utilizes cloud storage (S3) when available

The deployment is defined in the `.replit` configuration file, which includes:
- Build commands
- Run commands
- Port configuration

## 7. Security Considerations

- **Authentication**: Password hashing using scrypt with salt
- **File Storage**: Validation of file types and sizes
- **Database Access**: Type-safe queries through ORM
- **Sessions**: Server-side session storage with secure cookies

## 8. Future Architectural Considerations

- **Scaling**: 
  - The application is designed to scale horizontally
  - File storage abstraction allows for seamless transition to cloud storage
  
- **Modularity**:
  - Components are modular and can be extended
  - Storage interfaces allow for alternative implementations

- **Monitoring and Observability**:
  - Current logging is basic and could be enhanced
  - No dedicated error tracking or analytics solutions in place