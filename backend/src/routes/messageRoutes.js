const express = require('express');
const { sendMessage, getConversations, getMessagesWithUser, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getConversations);
router.post('/', protect, sendMessage);
router.get('/:otherUserId', protect, getMessagesWithUser);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
