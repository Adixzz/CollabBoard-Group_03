const Task = require('../models/Task');
const Board = require('../models/Board');

const getTasks = async (req, res) => {
  try {
    const { boardId } = req.query;
    const filter = boardId ? { boardId } : {};

    const tasks = await Task.find(filter)
      .populate('ownerId', 'username')
      .populate('assignees', 'username')
      .populate('assigneeId', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, tag, priority, boardId, assigneeId, assignees, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!boardId) {
      return res.status(400).json({ message: 'boardId is required' });
    }

    let validAssignees = [];
    if (Array.isArray(assignees)) {
      validAssignees = assignees.filter((id) => id && String(id).trim() !== '');
    } else if (assigneeId && String(assigneeId).trim() !== '') {
      validAssignees = [assigneeId];
    }

    const validAssigneeId = validAssignees.length > 0 ? validAssignees[0] : null;

    const newTask = await Task.create({
      title: title.trim(),
      description: description || '',
      status: status || 'To-Do',
      tag: tag || 'Frontend',
      priority: priority || 'Medium',
      boardId,
      ownerId: req.user.id,
      assignees: validAssignees,
      assigneeId: validAssigneeId,
      dueDate: dueDate || '',
    });

    const populatedTask = await Task.findById(newTask._id)
      .populate('ownerId', 'username')
      .populate('assignees', 'username')
      .populate('assigneeId', 'username');

    if (req.io) {
      req.io.to(`board_${boardId}`).emit('task_created', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = { ...req.body };

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await Board.findById(task.boardId);
    const isBoardOwner = board && board.owner.toString() === req.user.id.toString();
    const isTaskOwner = task.ownerId && task.ownerId.toString() === req.user.id.toString();

    const isNonStatusUpdate = ['title', 'description', 'tag', 'priority', 'assignees', 'assigneeId', 'dueDate'].some((key) => key in updateData);
    if (isNonStatusUpdate) {
      if (!isTaskOwner && !isBoardOwner) {
        return res.status(403).json({ message: 'Only the creator of this task can edit its details' });
      }
    }

    if (updateData.status && updateData.status !== task.status) {
      const isAssigned = (task.assignees && task.assignees.some((a) => a.toString() === req.user.id.toString())) ||
        (task.assigneeId && task.assigneeId.toString() === req.user.id.toString());

      if (!isAssigned && !isBoardOwner && !isTaskOwner) {
        return res.status(403).json({ message: 'Only assigned members can update the status of this task' });
      }
    }

    if ('assignees' in updateData) {
      if (Array.isArray(updateData.assignees)) {
        updateData.assignees = updateData.assignees.filter((id) => id && String(id).trim() !== '');
      } else {
        updateData.assignees = [];
      }
      updateData.assigneeId = updateData.assignees.length > 0 ? updateData.assignees[0] : null;
    } else if ('assigneeId' in updateData) {
      const validAssigneeId = updateData.assigneeId && String(updateData.assigneeId).trim() !== '' 
        ? updateData.assigneeId 
        : null;
      updateData.assigneeId = validAssigneeId;
      if (validAssigneeId) {
        updateData.assignees = [validAssigneeId];
      } else {
        updateData.assignees = [];
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('ownerId', 'username')
      .populate('assignees', 'username')
      .populate('assigneeId', 'username');

    if (req.io) {
      req.io.to(`board_${updatedTask.boardId}`).emit('task_updated', updatedTask);
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await Board.findById(task.boardId);
    const isBoardOwner = board && board.owner.toString() === req.user.id.toString();
    const isTaskOwner = task.ownerId && task.ownerId.toString() === req.user.id.toString();

    if (!isTaskOwner && !isBoardOwner) {
      return res.status(403).json({ message: 'Only the creator of this task can delete it' });
    }

    await Task.findByIdAndDelete(taskId);

    if (req.io) {
      req.io.to(`board_${task.boardId}`).emit('task_deleted', {
        taskId: task._id,
        boardId: task.boardId,
      });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};