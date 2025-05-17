import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { setupTestApp } from './setup';

describe('Authentication API', () => {
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const app = await setupTestApp();
    request = supertest(app);
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const testUser = {
        username: `test-user-${Date.now()}`,
        password: 'TestPassword123!',
        email: `test-${Date.now()}@example.com`,
        name: 'Test User'
      };

      const response = await request
        .post('/api/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should reject registration with an existing username', async () => {
      const testUser = {
        username: `duplicate-user-${Date.now()}`,
        password: 'TestPassword123!',
        email: `duplicate-${Date.now()}@example.com`,
        name: 'Duplicate User'
      };

      // First registration should succeed
      await request
        .post('/api/register')
        .send(testUser)
        .expect(201);

      // Second registration with same username should fail
      const response = await request
        .post('/api/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Username already exists');
    });
  });

  describe('User Login', () => {
    it('should login a user with valid credentials', async () => {
      // Create a test user first
      const testUser = {
        username: `login-test-${Date.now()}`,
        password: 'LoginTest123!',
        email: `login-${Date.now()}@example.com`,
        name: 'Login Test User'
      };

      await request
        .post('/api/register')
        .send(testUser)
        .expect(201);

      // Now try to login
      const response = await request
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject login with invalid credentials', async () => {
      await request
        .post('/api/login')
        .send({
          username: 'nonexistent-user',
          password: 'wrong-password'
        })
        .expect(401);
    });
  });

  describe('User Session', () => {
    it('should get current user when authenticated', async () => {
      // Create and login a test user
      const testUser = {
        username: `session-test-${Date.now()}`,
        password: 'SessionTest123!',
        email: `session-${Date.now()}@example.com`,
        name: 'Session Test User'
      };

      await request
        .post('/api/register')
        .send(testUser)
        .expect(201);

      const agent = supertest.agent(request.app);

      await agent
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      // Now check if we can get the user details
      const response = await agent
        .get('/api/user')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 for unauthenticated user', async () => {
      await request
        .get('/api/user')
        .expect(401);
    });

    it('should successfully logout a user', async () => {
      // Create and login a test user
      const testUser = {
        username: `logout-test-${Date.now()}`,
        password: 'LogoutTest123!',
        email: `logout-${Date.now()}@example.com`,
        name: 'Logout Test User'
      };

      await request
        .post('/api/register')
        .send(testUser)
        .expect(201);

      const agent = supertest.agent(request.app);

      await agent
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      // Now logout
      await agent
        .post('/api/logout')
        .expect(200);

      // Verify we're logged out
      await agent
        .get('/api/user')
        .expect(401);
    });
  });
});