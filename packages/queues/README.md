# Queues

Background job processing using BullMQ for AI-related tasks.

## Overview

This package provides:
- Background processing for CPU-intensive tasks
- AI-related job definitions and processing
- Redis-backed job queue with persistence

## Directory Structure

- `/ai.ts` - AI-related job definitions and processing
- `/worker.ts` - Worker process for handling background jobs

## Features

- Table of contents generation for PDF books
- Summarization of selected text from documents
- Class page generation for courses

## Getting Started

The queues module uses [BullMQ](https://docs.bullmq.io/) with Redis for job processing.

### Running the Worker

To process jobs in the background:

```bash
npm run worker
```

or

```bash
ts-node packages/queues/worker.ts
```

### Adding Jobs

```ts
import { addAIJob, AIJobType } from 'packages/queues/ai';

// Add a job to generate table of contents
await addAIJob({
  type: AIJobType.GENERATE_TOC,
  data: {
    bookId: '123',
    pageCount: 350
  }
});
```

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

## Graceful Degradation

The queue system is designed to degrade gracefully when Redis is unavailable:
- Jobs will be processed synchronously in the main thread
- Errors are logged and operations continue without Redis
- No data loss occurs when Redis is temporarily unavailable