# Client

React frontend application for the MIT Linear Algebra course learning platform.

## Overview

This client provides:
- Interactive course content organized by chapters and sections
- Multi-book PDF viewer with annotations support
- Academic grade tracking and forecasting
- Authentication system
- Course progress visualization

## Directory Structure

- `/src/components/` - Reusable UI components
- `/src/components/ui/` - Shadcn/UI component library
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and API clients
- `/src/pages/` - Page components (route destinations)
- `/src/providers/` - React context providers
- `/src/utils/` - Helper utilities

## Key Features

### Course Content
- Problem set organization by chapter and section
- Solution upload and management
- Lecture links integration

### PDF Textbook Viewer
- Support for multiple textbooks
- Page navigation
- Table of contents
- Annotations

### Grades & Forecasting
- Semester organization
- Grade tracking by course
- Grade forecasting
- Drag-and-drop reordering

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `VITE_API_URL` | API base URL | `/api` |

## Path Aliases

The client uses TypeScript path aliases for cleaner imports:

| Alias | Path |
|-------|------|
| `@/*` | `./src/*` |
| `@shared/*` | `../shared/*` |