import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { createLogger } from '../../shared/logger.js';

// Create a specialized logger for AI queue operations
const aiLogger = createLogger({ category: 'ai-queue' });

// AI Job Types
export enum AIJobType {
  GENERATE_TOC = 'generate-toc',
  SUMMARIZE_SELECTION = 'summarize-selection',
  GENERATE_CLASS_PAGE = 'generate-class-page',
}

// Job Data Interfaces
export interface GenerateTocJobData {
  bookId: string;
  pageCount: number;
}

export interface SummarizeSelectionJobData {
  bookId: string;
  text: string;
  pageNumber: number;
}

export interface GenerateClassPageJobData {
  courseId: string;
  topic: string;
  prompt: string;
}

// Union type for all job data
export type AIJobData = 
  | { type: AIJobType.GENERATE_TOC, data: GenerateTocJobData }
  | { type: AIJobType.SUMMARIZE_SELECTION, data: SummarizeSelectionJobData }
  | { type: AIJobType.GENERATE_CLASS_PAGE, data: GenerateClassPageJobData };

// Redis connection (to be initialized before use)
let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection for AI queues
 */
export function initializeRedis() {
  if (redisClient) return redisClient;
  
  try {
    // Create Redis connection
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Set up error handler
    redisClient.on('error', (err) => {
      aiLogger.error('Redis connection error:', err.message);
      isRedisAvailable = false;
    });
    
    // Set up connect handler
    redisClient.on('connect', () => {
      aiLogger.info('Redis connected successfully');
      isRedisAvailable = true;
    });
    
    return redisClient;
  } catch (error) {
    aiLogger.error('Redis initialization error:', error);
    isRedisAvailable = false;
    return null;
  }
}

// Try to create the AI queue, but handle the case where Redis is not available
let aiQueue: Queue<AIJobData> | null = null;

try {
  const redis = initializeRedis();
  
  if (redis) {
    aiQueue = new Queue<AIJobData>('ai-queue', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
    aiLogger.info('AI queue initialized successfully');
  } else {
    aiLogger.warn('AI queue not initialized: Redis connection unavailable');
  }
} catch (error) {
  aiLogger.error('Error creating AI queue:', error);
}

/**
 * Add a job to the AI queue
 * @param job The job data to add to the queue
 * @returns The created job or null if Redis is not available
 */
export async function addAIJob(job: AIJobData) {
  if (!aiQueue) {
    aiLogger.warn('Cannot add job: AI queue not initialized');
    return null;
  }
  
  try {
    return await aiQueue.add(job.type, job);
  } catch (error) {
    aiLogger.error('Error adding job to AI queue:', error);
    return null;
  }
}

/**
 * Process jobs in the AI queue (should be run in a separate worker process)
 * @returns The worker instance or null if Redis is not available
 */
export function startAIWorker() {
  const redis = initializeRedis();
  
  if (!redis) {
    aiLogger.warn('Cannot start AI worker: Redis connection unavailable');
    return null;
  }
  
  try {
    const worker = new Worker<AIJobData>('ai-queue', async (job: Job<AIJobData>) => {
      aiLogger.info(`Processing AI job: ${job.name}`, job.data);
      
      try {
        switch (job.name) {
          case AIJobType.GENERATE_TOC:
            return await processGenerateTocJob(job.data as AIJobData & { type: AIJobType.GENERATE_TOC });
            
          case AIJobType.SUMMARIZE_SELECTION:
            return await processSummarizeSelectionJob(job.data as AIJobData & { type: AIJobType.SUMMARIZE_SELECTION });
            
          case AIJobType.GENERATE_CLASS_PAGE:
            return await processGenerateClassPageJob(job.data as AIJobData & { type: AIJobType.GENERATE_CLASS_PAGE });
            
          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        aiLogger.error(`Error processing AI job ${job.name}:`, error);
        throw error; // Re-throw to trigger retry
      }
    }, {
      connection: redis,
      concurrency: 2, // Process up to 2 jobs concurrently
    });
    
    worker.on('completed', (job) => {
      aiLogger.info(`AI job ${job.id} completed`);
    });
    
    worker.on('failed', (job, err) => {
      aiLogger.error(`AI job ${job?.id} failed:`, err);
    });
    
    aiLogger.info('AI worker started');
    
    return worker;
  } catch (error) {
    aiLogger.error('Error starting AI worker:', error);
    return null;
  }
}

/**
 * Process a table of contents generation job
 */
async function processGenerateTocJob(job: AIJobData & { type: AIJobType.GENERATE_TOC }) {
  aiLogger.info('Processing TOC generation job', job.data);
  
  // TODO: Implement actual AI model call
  // 1. Get the book content (first few pages)
  // 2. Call AI model with prompt to generate TOC
  // 3. Store results in database
  // 4. Emit WebSocket event to notify client
  
  // Placeholder implementation
  const result = {
    jobId: Math.random().toString(36).substring(7),
    bookId: job.data.bookId,
    toc: [
      { title: 'Chapter 1: Introduction', page: 1 },
      { title: 'Chapter 2: Foundations', page: 15 },
      // ... more entries would be here in a real implementation
    ],
  };
  
  // In a real implementation, you would:
  // 1. Save this to the database
  // 2. Emit a WebSocket event to notify clients
  
  return result;
}

/**
 * Process a text summarization job
 */
async function processSummarizeSelectionJob(job: AIJobData & { type: AIJobType.SUMMARIZE_SELECTION }) {
  aiLogger.info('Processing text summarization job', job.data);
  
  // TODO: Implement actual AI model call
  // 1. Call AI model with the selected text to get summary
  // 2. Store results in database
  // 3. Emit WebSocket event to notify client
  
  // Placeholder implementation
  const result = {
    jobId: Math.random().toString(36).substring(7),
    bookId: job.data.bookId,
    pageNumber: job.data.pageNumber,
    summary: 'This is a placeholder summary of the selected text. In a real implementation, this would be generated by an AI model.',
  };
  
  // In a real implementation, you would:
  // 1. Save this to the database
  // 2. Emit a WebSocket event to notify clients
  
  return result;
}

/**
 * Process a class page generation job
 */
async function processGenerateClassPageJob(job: AIJobData & { type: AIJobType.GENERATE_CLASS_PAGE }) {
  aiLogger.info('Processing class page generation job', job.data);
  
  // TODO: Implement actual AI model call
  // 1. Call AI model with the course topic and prompt
  // 2. Store the generated HTML/content in the database
  // 3. Emit WebSocket event to notify client
  
  // Placeholder implementation
  const result = {
    jobId: Math.random().toString(36).substring(7),
    courseId: job.data.courseId,
    topic: job.data.topic,
    content: `
      <h1>${job.data.topic}</h1>
      <p>This is a placeholder for the AI-generated content for this topic.</p>
      <p>In a real implementation, this would be a rich HTML content generated by an AI model based on the prompt:</p>
      <blockquote>${job.data.prompt}</blockquote>
    `,
  };
  
  // In a real implementation, you would:
  // 1. Save this to the database
  // 2. Emit a WebSocket event to notify clients
  
  return result;
}

// Export the queue for use in other parts of the application
export { aiQueue };