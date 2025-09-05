const express = require('express');
const router = express.Router();
const updateProfile = require('../controller/updateProfile');
const isLoggedIn = require('../middleware/isLoggedIn');
const upload = require('../middleware/upload');

router.put('/', isLoggedIn, upload.single('avatar'), updateProfile);

module.exports = router;
