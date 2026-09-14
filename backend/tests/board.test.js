const request = require('supertest');
const { app } = require('../server');
require('./setup');

describe('Board API Tests', () => {
  let token;
  let user;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Sandev',
        password: 'password123',
      });
    token = regRes.body.token;
    user = regRes.body.user;
  });

  it('should create a board successfully', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sprint 1 Kanban' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Sprint 1 Kanban');
    expect(res.body.owner.username).toBe('Sandev');
  });

  it('should get all boards associated with the user', async () => {
    await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Board A' });

    await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Board B' });

    const res = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('should update board title', async () => {
    const createRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old Title' });

    const boardId = createRes.body._id;

    const updateRes = await request(app)
      .put(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Renamed Title' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.title).toBe('New Renamed Title');
  });

  it('should delete board successfully', async () => {
    const createRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Temporary Board' });

    const boardId = createRes.body._id;

    const delRes = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.statusCode).toBe(200);

    const getRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.statusCode).toBe(404);
  });
});
