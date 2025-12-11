// __tests__/api/listings.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Listings API', () => {
  describe('GET /api/v1/listings', () => {
    it('should return listings with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/listings')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toHaveProperty('total');
    });
  });
});