const express = require('express');
const router = express.Router();
const database = require('../database');

// Get chat messages for a user
router.get('/messages', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all messages for this user (both sent and received)
    const messages = await database.getChatMessages(userId);
    
    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderType: msg.senderType,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        isRead: msg.isRead
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a new chat message
router.post('/send', async (req, res) => {
  try {
    const { message, recipientType } = req.body;
    const userId = req.user.id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get user info for sender name
    const user = await database.getUserById(userId);
    
    // Create the message
    const chatMessage = await database.createChatMessage({
      senderId: userId,
      senderType: 'user',
      senderName: user.email,
      recipientType: recipientType || 'admin',
      message: message.trim(),
      timestamp: new Date(),
      isRead: false
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: {
        id: chatMessage.id,
        senderId: chatMessage.senderId,
        senderType: chatMessage.senderType,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp,
        isRead: chatMessage.isRead
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.put('/mark-read', async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Message IDs array is required' });
    }
    
    // Mark messages as read for this user
    const updatedCount = await database.markMessagesAsRead(userId, messageIds);
    
    res.json({
      message: 'Messages marked as read',
      updatedCount
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await database.getUnreadMessageCount(userId);
    
    res.json({
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes (require admin role)
router.get('/admin/conversations', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get all conversations grouped by user
    const conversations = await database.getAllConversations();
    
    res.json({
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin send message
router.post('/admin/send', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { message, recipientUserId } = req.body;
    const adminId = req.user.id;
    
    if (!message || !message.trim() || !recipientUserId) {
      return res.status(400).json({ error: 'Message and recipient user ID are required' });
    }
    
    // Get admin info for sender name
    const admin = await database.getUserById(adminId);
    
    // Create the message
    const chatMessage = await database.createChatMessage({
      senderId: adminId,
      senderType: 'admin',
      senderName: admin.email,
      recipientUserId: recipientUserId,
      recipientType: 'user',
      message: message.trim(),
      timestamp: new Date(),
      isRead: false
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage
    });
  } catch (error) {
    console.error('Admin send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;