const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const { searchUsers } = require('../controller/search');

// Search routes
router.get('/users', isLoggedIn, searchUsers);

module.exports = router;
