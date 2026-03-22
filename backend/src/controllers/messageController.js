const prisma = require('../utils/db');

const sendMessage = async (req, res) => {
  try {
    const { recipientIdentifier, content } = req.body;
    const senderId = req.user.userId;

    if (!content || !recipientIdentifier) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    // Find recipient by email or name
    const recipient = await prisma.user.findFirst({
      where: {
        OR: [
          { email: recipientIdentifier.toLowerCase() },
          { name: { equals: recipientIdentifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (recipient.id === senderId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: recipient.id,
        content
      },
      include: {
        sender: { select: { name: true, email: true, avatar: true } },
        receiver: { select: { name: true, email: true, avatar: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('[Message] Send Error:', error);
    res.status(500).json({ message: 'Server Error while sending message' });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    // Group by the "other" user
    const conversations = [];
    const seenUsers = new Set();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!seenUsers.has(otherUser.id)) {
        seenUsers.add(otherUser.id);
        
        // Count unread for this specific conversation
        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherUser.id,
            receiverId: userId,
            isRead: false
          }
        });

        conversations.push({
          id: otherUser.id,
          user: otherUser,
          lastMessage: msg,
          unreadCount
        });
      }
    }

    res.json(conversations);
  } catch (error) {
    console.error('[Message] Get Conversations Error:', error);
    res.status(500).json({ message: 'Server Error fetching conversations' });
  }
};

const getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(messages);
  } catch (error) {
    console.error('[Message] Get Thread Error:', error);
    res.status(500).json({ message: 'Server Error fetching message thread' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Security: Only sender or receiver can delete
    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await prisma.message.delete({
      where: { id }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('[Message] Delete Error:', error);
    res.status(500).json({ message: 'Server Error while deleting message' });
  }
};

module.exports = { sendMessage, getConversations, getMessagesWithUser, deleteMessage };
