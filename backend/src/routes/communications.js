const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Mock message data
let messages = [
  {
    id: '1',
    platform: 'slack',
    type: 'incoming',
    sender: {
      id: 's1',
      name: 'Sarah Johnson',
    },
    recipient: {
      id: 'r1',
      name: 'Support Team',
      channel: '#support',
    },
    content: 'Hey team, the client is asking about the server migration timeline. Can someone update them?',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'read',
    thread: {
      id: 't1',
      messageCount: 3,
    },
  },
  {
    id: '2',
    platform: 'twilio',
    type: 'incoming',
    sender: {
      id: 's2',
      name: 'John Doe',
      phone: '+1234567890',
    },
    recipient: {
      id: 'r2',
      name: 'DuetRight IT',
      phone: '+0987654321',
    },
    content: 'Is someone available to help with my email setup today?',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'delivered',
  },
];

// Mock conversation data
let conversations = [
  {
    id: 'c1',
    title: 'Server Migration Discussion',
    participants: [
      { id: 'p1', name: 'Sarah Johnson' },
      { id: 'p2', name: 'Support Team' },
    ],
    platform: 'slack',
    lastMessage: messages[0],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    updatedAt: messages[0].timestamp,
    status: 'active',
  },
];

// Get messages
router.get('/messages', authenticateToken, (req, res) => {
  const {
    platform,
    type,
    search,
    page = 1,
    limit = 50,
  } = req.query;

  let filteredMessages = [...messages];

  // Apply filters
  if (platform && platform !== 'all') {
    filteredMessages = filteredMessages.filter((m) => m.platform === platform);
  }

  if (type && type !== 'all') {
    filteredMessages = filteredMessages.filter((m) => m.type === type);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredMessages = filteredMessages.filter(
      (m) =>
        m.content.toLowerCase().includes(searchLower) ||
        m.sender.name.toLowerCase().includes(searchLower)
    );
  }

  // Sort by timestamp desc
  filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

  res.json({
    messages: paginatedMessages,
    total: filteredMessages.length,
    page: parseInt(page),
    limit: parseInt(limit),
    hasMore: endIndex < filteredMessages.length,
  });
});

// Get conversations
router.get('/conversations', authenticateToken, (req, res) => {
  const { platform, status } = req.query;

  let filteredConversations = [...conversations];

  if (platform) {
    filteredConversations = filteredConversations.filter(
      (c) => c.platform === platform
    );
  }

  if (status) {
    filteredConversations = filteredConversations.filter(
      (c) => c.status === status
    );
  }

  res.json({
    conversations: filteredConversations,
    total: filteredConversations.length,
    page: 1,
    limit: 50,
    hasMore: false,
  });
});

// Send message
router.post('/messages/send', authenticateToken, (req, res) => {
  const { platform, recipient, content } = req.body;

  const newMessage = {
    id: Date.now().toString(),
    platform,
    type: 'outgoing',
    sender: {
      id: req.user.id,
      name: req.user.name || 'DuetRight IT',
    },
    recipient: {
      id: recipient,
      name: recipient,
    },
    content,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  messages.unshift(newMessage);

  // Simulate delivery after 1 second
  setTimeout(() => {
    const index = messages.findIndex((m) => m.id === newMessage.id);
    if (index !== -1) {
      messages[index].status = 'delivered';
    }
  }, 1000);

  res.status(201).json(newMessage);
});

// Mark messages as read
router.post('/messages/read', authenticateToken, (req, res) => {
  const { messageIds } = req.body;

  messageIds.forEach((id) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index !== -1) {
      messages[index].status = 'read';
    }
  });

  res.json({ success: true });
});

// Get communication stats
router.get('/stats', authenticateToken, (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todaysMessages = messages.filter(
    (m) => new Date(m.timestamp) >= today
  );

  const stats = {
    totalMessages: messages.length,
    sentMessages: messages.filter((m) => m.type === 'outgoing').length,
    receivedMessages: messages.filter((m) => m.type === 'incoming').length,
    responseTime: {
      average: 15, // Mock average response time in minutes
    },
    platforms: {
      slack: messages.filter((m) => m.platform === 'slack').length,
      twilio: messages.filter((m) => m.platform === 'twilio').length,
      email: messages.filter((m) => m.platform === 'email').length,
    },
    recentActivity: [
      { date: today.toISOString().split('T')[0], messageCount: todaysMessages.length },
    ],
  };

  res.json(stats);
});

// Delete message
router.delete('/messages/:id', authenticateToken, (req, res) => {
  const index = messages.findIndex((m) => m.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Message not found' });
  }

  messages.splice(index, 1);
  res.status(204).send();
});

module.exports = router;