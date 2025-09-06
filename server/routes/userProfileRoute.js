const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const { viewUserProfile } = require('../controller/userProfile');

router.get('/:userId', isLoggedIn, viewUserProfile);

module.exports = router;
