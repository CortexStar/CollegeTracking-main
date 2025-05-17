import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { aiQueue } from '../packages/queues/ai';

// Client connections organized by user ID
const clients = new Map<string, Set<WebSocket>>();

// Initialize WebSocket server
export function setupWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  console.log('WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    // Generate a unique client ID if there's no authenticated user
    const userId = req.headers['user-id'] as string || `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Store client connection
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)?.add(ws);
    
    console.log(`WebSocket client connected: ${userId}`);

    // Handle client disconnect
    ws.on('close', () => {
      const userClients = clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`WebSocket client disconnected: ${userId}`);
    });

    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from ${userId}:`, data);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
            
          default:
            console.log(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected', 
      userId, 
      timestamp: Date.now() 
    }));
  });

  // Set up BullMQ event listeners if the queue is available
  if (aiQueue) {
    aiQueue.on('completed', (job, result) => {
      broadcastToAll({
        type: 'job-completed',
        jobId: job.id,
        jobName: job.name,
        result
      });
    });

    aiQueue.on('failed', (job, error) => {
      broadcastToAll({
        type: 'job-failed',
        jobId: job?.id,
        jobName: job?.name,
        error: error.message
      });
    });

    aiQueue.on('active', (job) => {
      broadcastToAll({
        type: 'job-started',
        jobId: job.id,
        jobName: job.name
      });
    });
    
    console.log('WebSocket connected to AI queue for event listening');
  } else {
    console.log('AI queue not available for WebSocket event listening');
  }

  return wss;
}

/**
 * Send a message to all connected clients for a specific user
 */
export function sendToUser(userId: string, message: any) {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const messageStr = JSON.stringify(message);
  
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcastToAll(message: any) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  });
}