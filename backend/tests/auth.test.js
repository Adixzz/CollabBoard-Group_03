const request = require('supertest');
const { app } = require('../server');
require('./setup');

describe('Auth API Tests', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Sandev',
        password: 'password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'Sandev');
  });

  it('should fail registration with duplicate username', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Kavindu',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Kavindu',
        password: 'anotherpassword',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should login an existing user and return a JWT', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Adithya',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'Adithya',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('Adithya');
  });

  it('should reject login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Dilana',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'Dilana',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
  });
});
