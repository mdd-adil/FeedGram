const express = require('express');
const router = express.Router();
const { getChatHistory, getChatUsers, markAsRead, getDirectMessageUser } = require('../controller/chat');
const isLoggedIn = require('../middleware/isLoggedIn');

// Get chat history with a specific user
router.get('/history/:userId', isLoggedIn, getChatHistory);

// Get list of users to chat with (ONLY following users + users with existing chat history)
router.get('/users', isLoggedIn, getChatUsers);

// Get specific user for direct messaging
router.get('/user/:userId', isLoggedIn, getDirectMessageUser);

// Mark messages as read
router.put('/read/:userId', isLoggedIn, markAsRead);

module.exports = router;
