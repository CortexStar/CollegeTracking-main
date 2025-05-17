import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { setupTestApp } from './setup';
import * as fs from 'fs';
import * as path from 'path';

describe('Book API', () => {
  let request: supertest.SuperTest<supertest.Test>;
  let agent: supertest.SuperAgentTest;
  let userId: string;

  beforeAll(async () => {
    const app = await setupTestApp();
    request = supertest(app);
    agent = supertest.agent(app);

    // Create a test user and log in
    const testUser = {
      username: `book-test-user-${Date.now()}`,
      password: 'BookTest123!',
      email: `booktest-${Date.now()}@example.com`,
      name: 'Book Test User'
    };

    // Register the user
    const registerResponse = await request
      .post('/api/register')
      .send(testUser);
    
    userId = registerResponse.body.id;

    // Log in as the user
    await agent
      .post('/api/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });
  });

  describe('Get Books', () => {
    it('should get user books when authenticated', async () => {
      const response = await agent
        .get('/api/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get anonymous books when not authenticated', async () => {
      const response = await request
        .get('/api/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Upload Book', () => {
    // This test assumes you have a sample PDF in your project
    // We'll create a small PDF-like buffer for testing
    it('should upload a PDF book when authenticated', async () => {
      // Create a simple PDF-like buffer for testing
      const pdfBuffer = Buffer.from('%PDF-1.5\nThis is a test PDF file\n%%EOF');
      
      const response = await agent
        .post('/api/books/upload')
        .field('title', 'Test PDF Book')
        .field('author', 'Test Author')
        .attach('pdfFile', pdfBuffer, 'test.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test PDF Book');
      expect(response.body).toHaveProperty('author', 'Test Author');
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('storedName');
      expect(response.body).toHaveProperty('originalName', 'test.pdf');
    });

    it('should reject non-PDF uploads', async () => {
      const textBuffer = Buffer.from('This is not a PDF file');
      
      await agent
        .post('/api/books/upload')
        .field('title', 'Invalid File')
        .field('author', 'Test Author')
        .attach('pdfFile', textBuffer, 'test.txt')
        .expect(400);
    });

    it('should require a title', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.5\nThis is a test PDF file\n%%EOF');
      
      await agent
        .post('/api/books/upload')
        .field('author', 'Test Author')
        .attach('pdfFile', pdfBuffer, 'test.pdf')
        .expect(400);
    });
  });

  describe('Get Book by ID', () => {
    let testBookId: string;

    beforeAll(async () => {
      // Upload a test book to use in subsequent tests
      const pdfBuffer = Buffer.from('%PDF-1.5\nThis is a test PDF file\n%%EOF');
      
      const response = await agent
        .post('/api/books/upload')
        .field('title', 'Get Book Test')
        .field('author', 'Test Author')
        .attach('pdfFile', pdfBuffer, 'get-test.pdf');

      testBookId = response.body.id;
    });

    it('should get a book by ID', async () => {
      const response = await request
        .get(`/api/books/${testBookId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testBookId);
      expect(response.body).toHaveProperty('title', 'Get Book Test');
      expect(response.body).toHaveProperty('author', 'Test Author');
    });

    it('should return 404 for non-existent book ID', async () => {
      await request
        .get('/api/books/nonexistent-id')
        .expect(404);
    });
  });

  describe('Delete Book', () => {
    let testBookId: string;

    beforeAll(async () => {
      // Upload a test book to delete
      const pdfBuffer = Buffer.from('%PDF-1.5\nThis is a test PDF file\n%%EOF');
      
      const response = await agent
        .post('/api/books/upload')
        .field('title', 'Delete Book Test')
        .field('author', 'Test Author')
        .attach('pdfFile', pdfBuffer, 'delete-test.pdf');

      testBookId = response.body.id;
    });

    it('should delete a book when authenticated as the owner', async () => {
      await agent
        .delete(`/api/books/${testBookId}`)
        .expect(200);

      // Verify the book is gone
      await request
        .get(`/api/books/${testBookId}`)
        .expect(404);
    });

    it('should prevent deleting a non-existent book', async () => {
      await agent
        .delete('/api/books/nonexistent-id')
        .expect(404);
    });

    it('should prevent deleting the built-in book', async () => {
      await agent
        .delete('/api/books/linear-algebra-default')
        .expect(403);
    });

    it('should prevent deleting books owned by other users', async () => {
      // Create another user
      const otherUser = {
        username: `other-user-${Date.now()}`,
        password: 'OtherUser123!',
        email: `other-${Date.now()}@example.com`,
        name: 'Other User'
      };

      await request
        .post('/api/register')
        .send(otherUser);

      const otherAgent = supertest.agent(request.app);

      await otherAgent
        .post('/api/login')
        .send({
          username: otherUser.username,
          password: otherUser.password
        });

      // Upload a book as the other user
      const pdfBuffer = Buffer.from('%PDF-1.5\nThis is a test PDF file\n%%EOF');
      
      const response = await otherAgent
        .post('/api/books/upload')
        .field('title', 'Other User Book')
        .field('author', 'Other Author')
        .attach('pdfFile', pdfBuffer, 'other-test.pdf');

      const otherBookId = response.body.id;

      // Try to delete the other user's book
      await agent
        .delete(`/api/books/${otherBookId}`)
        .expect(403);
    });
  });
});