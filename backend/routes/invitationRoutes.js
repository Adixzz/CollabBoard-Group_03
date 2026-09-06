const express = require('express');
const router = express.Router();
const {
  sendInvitation,
  getPendingInvitations,
  getSentInvitations,
  respondToInvitation,
  cancelInvitation,
} = require('../controllers/invitationController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendInvitation);
router.get('/pending', getPendingInvitations);
router.get('/sent', getSentInvitations);
router.put('/:id/respond', respondToInvitation);
router.delete('/:id', cancelInvitation);

module.exports = router;
