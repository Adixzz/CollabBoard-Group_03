const Invitation = require('../models/Invitation');
const Board = require('../models/Board');
const User = require('../models/User');

const sendInvitation = async (req, res) => {
  try {
    const { boardId, username } = req.body;

    if (!boardId || !username || !username.trim()) {
      return res.status(400).json({ message: 'Board ID and username are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can invite members' });
    }

    const recipient = await User.findOne({ username: username.trim() });
    if (!recipient) {
      return res.status(404).json({ message: `User "${username.trim()}" not found` });
    }

    if (recipient._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You are already the owner of this board' });
    }

    const isAlreadyMember = board.members.some(
      (m) => m.toString() === recipient._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    const existingInvite = await Invitation.findOne({
      boardId: board._id,
      recipientId: recipient._id,
      status: 'pending',
    });
    if (existingInvite) {
      return res.status(400).json({ message: 'An invitation has already been sent to this user' });
    }

    const newInvitation = await Invitation.create({
      boardId: board._id,
      inviterId: req.user.id,
      recipientId: recipient._id,
      status: 'pending',
    });

    const populatedInvite = await Invitation.findById(newInvitation._id)
      .populate('boardId', 'title')
      .populate('inviterId', 'username')
      .populate('recipientId', 'username');

    if (req.io) {
      req.io.to(`user_${recipient._id}`).emit('invitation_received', populatedInvite);
    }

    res.status(201).json({
      message: `Invitation sent to ${recipient.username}`,
      invitation: populatedInvite,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send invitation', error: error.message });
  }
};

const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      recipientId: req.user.id,
      status: 'pending',
    })
      .populate('boardId', 'title')
      .populate('inviterId', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { action } = req.body;
    const invitationId = req.params.id;

    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: "Action must be either 'accept' or 'decline'" });
    }

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.recipientId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation already ${invitation.status}` });
    }

    if (action === 'accept') {
      await Board.findByIdAndUpdate(invitation.boardId, {
        $addToSet: { members: req.user.id },
      });
      invitation.status = 'accepted';
    } else {
      invitation.status = 'declined';
    }

    await invitation.save();

    const populatedInvite = await Invitation.findById(invitation._id)
      .populate('boardId', 'title')
      .populate('inviterId', 'username')
      .populate('recipientId', 'username');

    if (req.io) {
      req.io.to(`user_${invitation.inviterId}`).emit('invitation_updated', populatedInvite);
      if (action === 'accept') {
        req.io.to(`board_${invitation.boardId}`).emit('member_joined', {
          boardId: invitation.boardId,
          user: { _id: req.user.id, username: req.user.username },
        });
      }
    }

    res.status(200).json({
      message: `Invitation ${action}ed successfully`,
      invitation: populatedInvite,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to invitation', error: error.message });
  }
};

const getSentInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      inviterId: req.user.id,
    })
      .populate('boardId', 'title')
      .populate('recipientId', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sent invitations', error: error.message });
  }
};

const cancelInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;
    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.inviterId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this invitation' });
    }

    await Invitation.findByIdAndDelete(invitationId);

    if (req.io) {
      req.io.to(`user_${invitation.recipientId}`).emit('invitation_canceled', {
        invitationId: invitation._id,
      });
    }

    res.status(200).json({ message: 'Invitation canceled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel invitation', error: error.message });
  }
};

module.exports = {
  sendInvitation,
  getPendingInvitations,
  getSentInvitations,
  respondToInvitation,
  cancelInvitation,
};
