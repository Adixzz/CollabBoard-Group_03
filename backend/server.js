require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

connectDB();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  socket.on('join_board', (boardId) => {
    if (boardId) socket.join(`board_${boardId}`);
  });

  socket.on('leave_board', (boardId) => {
    if (boardId) socket.leave(`board_${boardId}`);
  });

  socket.on('join_user', (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });

  socket.on('leave_user', (userId) => {
    if (userId) socket.leave(`user_${userId}`);
  });
});

const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const invitationRoutes = require('./routes/invitationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invitations', invitationRoutes);

app.get('/', (req, res) => {
  res.send('CollabBoard API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});