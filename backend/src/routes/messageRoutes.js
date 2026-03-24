const express = require('express');
const { sendMessage, getConversations, getMessagesWithUser, deleteMessage, deleteConversation } = require('../controllers/messageController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

const router = express.Router();

// Viewing and sending messages require 'canViewMessages'
router.get('/', protect, checkPermission('canViewMessages'), getConversations);
router.post('/', protect, checkPermission('canViewMessages'), sendMessage);
router.get('/:otherUserId', protect, checkPermission('canViewMessages'), getMessagesWithUser);

// Deleting messages or conversations require 'canDeleteMessages'
router.delete('/conversation/:otherUserId', protect, checkPermission('canDeleteMessages'), deleteConversation);
router.delete('/:id', protect, checkPermission('canDeleteMessages'), deleteMessage);

module.exports = router;
