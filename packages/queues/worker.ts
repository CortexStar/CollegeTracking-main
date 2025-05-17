import { startAIWorker } from './ai';

/**
 * This file is meant to be run as a separate process to handle AI job processing
 * Example: ts-node packages/queues/worker.ts
 */

console.log('Starting AI worker process...');

// Start the AI worker to process jobs
const worker = startAIWorker();

if (worker) {
  // Handle process termination gracefully
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing worker...');
    await worker.close();
    process.exit(0);
  });

  console.log('AI worker process started and ready to process jobs');
} else {
  console.log('Failed to start AI worker. Redis connection may not be available.');
  console.log('The worker will now exit. Restart when Redis is available.');
  process.exit(1);
}