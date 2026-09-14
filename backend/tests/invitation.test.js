const request = require('supertest');
const { app } = require('../server');
require('./setup');

describe('Invitation API Tests', () => {
  let ownerToken, owner;
  let inviteeToken, invitee;
  let boardId;

  beforeEach(async () => {
    const r1 = await request(app)
      .post('/api/auth/register')
      .send({ username: 'Sandev', password: 'password123' });
    ownerToken = r1.body.token;
    owner = r1.body.user;

    const r2 = await request(app)
      .post('/api/auth/register')
      .send({ username: 'Adithya', password: 'password123' });
    inviteeToken = r2.body.token;
    invitee = r2.body.user;

    const bRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Collaborative Space' });
    boardId = bRes.body._id;
  });

  it('should send an invitation to another user', async () => {
    const res = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        boardId,
        username: 'Adithya',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.invitation.status).toBe('pending');
    expect(res.body.invitation.recipientId.username).toBe('Adithya');
  });

  it('should fetch pending invitations for recipient', async () => {
    await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        boardId,
        username: 'Adithya',
      });

    const res = await request(app)
      .get('/api/invitations/pending')
      .set('Authorization', `Bearer ${inviteeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].boardId.title).toBe('Collaborative Space');
  });

  it('should respond to invitation (accept) and add member to board', async () => {
    const sendRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        boardId,
        username: 'Adithya',
      });

    const invitationId = sendRes.body.invitation._id;

    const respondRes = await request(app)
      .put(`/api/invitations/${invitationId}/respond`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ action: 'accept' });

    expect(respondRes.statusCode).toBe(200);
    expect(respondRes.body.invitation.status).toBe('accepted');

    const boardRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const memberIds = boardRes.body.members.map((m) => m._id.toString());
    expect(memberIds).toContain(invitee.id.toString());
  });

  it('should cancel invitation by inviter', async () => {
    const sendRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        boardId,
        username: 'Adithya',
      });

    const invitationId = sendRes.body.invitation._id;

    const cancelRes = await request(app)
      .delete(`/api/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(cancelRes.statusCode).toBe(200);
  });
});
