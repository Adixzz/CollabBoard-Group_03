const request = require('supertest');
const { app } = require('../server');
require('./setup');

describe('Task API & Permissions Tests', () => {
  let user1Token, user1;
  let user2Token, user2;
  let boardId;

  beforeEach(async () => {
    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({ username: 'Sandev', password: 'password123' });
    user1Token = reg1.body.token;
    user1 = reg1.body.user;

    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ username: 'Kavindu', password: 'password123' });
    user2Token = reg2.body.token;
    user2 = reg2.body.user;

    const bRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Main Kanban Board' });
    boardId = bRes.body._id;

    await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ boardId, username: 'Kavindu' });

    const invRes = await request(app)
      .get('/api/invitations/pending')
      .set('Authorization', `Bearer ${user2Token}`);

    const inviteId = invRes.body[0]._id;
    await request(app)
      .put(`/api/invitations/${inviteId}/respond`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ action: 'accept' });
  });

  it('should create a task with assignees', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Design API Endpoints',
        description: 'REST endpoints for boards',
        tag: 'Backend',
        priority: 'High',
        boardId,
        assignees: [user2.id],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('title', 'Design API Endpoints');
    expect(res.body.status).toBe('To-Do');
    expect(res.body.assignees.length).toBe(1);
    expect(res.body.assignees[0].username).toBe('Kavindu');
  });

  it('should prevent non-creator from editing task details (403)', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Original Title',
        boardId,
        assignees: [user2.id],
      });

    const taskId = createRes.body._id;

    const editRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'Changed By Non-Creator',
      });

    expect(editRes.statusCode).toBe(403);
    expect(editRes.body.message).toMatch(/Only the creator of this task can edit its details/i);
  });

  it('should allow assigned member to update status', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Task To Complete',
        boardId,
        assignees: [user2.id],
      });

    const taskId = createRes.body._id;

    const statusRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        status: 'Doing',
      });

    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.status).toBe('Doing');
  });

  it('should allow creator to update task details', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Initial Title',
        boardId,
      });

    const taskId = createRes.body._id;

    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Updated Title By Creator',
        priority: 'High',
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.title).toBe('Updated Title By Creator');
    expect(updateRes.body.priority).toBe('High');
  });

  it('should delete task successfully by creator', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Task To Delete',
        boardId,
      });

    const taskId = createRes.body._id;

    const delRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(delRes.statusCode).toBe(200);
  });
});
