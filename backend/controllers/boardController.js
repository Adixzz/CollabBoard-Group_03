const Board = require('../models/Board');
const Task = require('../models/Task');

const getBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const boards = await Board.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .populate('owner', 'username')
      .populate('members', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch boards', error: error.message });
  }
};

const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username')
      .populate('members', 'username');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch board', error: error.message });
  }
};

const createBoard = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Board title is required' });
    }

    const userId = req.user.id;
    const newBoard = await Board.create({
      title: title.trim(),
      owner: userId,
      members: [userId],
    });

    const populatedBoard = await Board.findById(newBoard._id)
      .populate('owner', 'username')
      .populate('members', 'username');

    res.status(201).json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create board', error: error.message });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Board title is required' });
    }

    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    board.title = title.trim();
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'username')
      .populate('members', 'username');

    if (req.io) {
      req.io.to(`board_${board._id}`).emit('board_updated', populatedBoard);
    }

    res.status(200).json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update board', error: error.message });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    await Task.deleteMany({ boardId: board._id });
    await Board.findByIdAndDelete(board._id);

    if (req.io) {
      req.io.to(`board_${board._id}`).emit('board_deleted', { boardId: board._id });
    }

    res.status(200).json({ message: 'Board and all associated tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete board', error: error.message });
  }
};

module.exports = {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
};
