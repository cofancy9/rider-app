const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);
    
    expect(res.body.status).toBe('healthy');
  });
});
