const express = require('express');
const router = express.Router();
const { getChatHistory, getChatUsers, markAsRead } = require('../controller/chat');
const isLoggedIn = require('../middleware/isLoggedIn');

// Get chat history with a specific user
router.get('/history/:userId', isLoggedIn, getChatHistory);

// Get list of users to chat with
router.get('/users', isLoggedIn, getChatUsers);

// Mark messages as read
router.put('/read/:userId', isLoggedIn, markAsRead);

module.exports = router;
