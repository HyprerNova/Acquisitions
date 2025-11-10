// tests/api.test.js
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '#src/app.js';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app)
        .get('/api')
        .set('User-Agent', 'Supertest/1.0') // ADD THIS LINE
        .expect(200);

      // FIXED: Updated message
      expect(response.body).toHaveProperty(
        'message',
        'Acquisitions API is running!'
      );
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .set('User-Agent', 'Supertest/1.0') // ADD THIS LINE
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});
