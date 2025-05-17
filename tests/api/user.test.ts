import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { setupTestApp } from '../setup';
import { Express } from 'express';

describe('User API Routes', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  describe('GET /api/user', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/user');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/register', () => {
    it('should validate username requirements', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'ab', // Too short
          password: 'password123',
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'validuser',
          password: '12345', // Too short
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    // Unique test case for each registration attempt to avoid conflicts
    it('should register a new user successfully with valid data', async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      
      const response = await request(app)
        .post('/api/register')
        .send({
          username: uniqueUsername,
          password: 'password123',
          email: `${uniqueUsername}@example.com`,
          name: 'Test User'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('username', uniqueUsername);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    });
  });

  describe('POST /api/login', () => {
    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistentuser',
          password: 'wrongpassword',
        });
      
      expect(response.status).toBe(401);
    });

    // We test successful login with the demo user from our seed
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'demo',
          password: 'demo123',
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'demo');
    });
  });

  describe('POST /api/logout', () => {
    it('should return 200 even when not authenticated', async () => {
      const response = await request(app).post('/api/logout');
      expect(response.status).toBe(200);
    });
  });
});