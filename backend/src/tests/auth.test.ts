import request from 'supertest';
import { app, mockDb } from '../index';

describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test_${Date.now()}@example.com`,
        username: `testuser_${Date.now()}`,
        password: 'TestPass123!',
        full_name: 'Test User'
      });
    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBeDefined();
  });

  it('should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });
    expect(response.status).toBe(401);
  });

  it('should return 400 for missing fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(400);
  });

  it('should login with demo credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@devflow.ai', password: 'demo123' });
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe('demo@devflow.ai');
  });
});