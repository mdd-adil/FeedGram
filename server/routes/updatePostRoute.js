const express = require('express');
const router = express.Router();
const { updatePost, getPostForEdit } = require('../controller/updatePost');
const isLoggedIn = require('../middleware/isLoggedIn');
const upload = require('../middleware/upload');

// GET /updatePost/:postId - Get post for editing
router.get('/:postId', isLoggedIn, getPostForEdit);

// PUT /updatePost/:postId - Update post
router.put('/:postId', isLoggedIn, upload.single('image'), updatePost);

module.exports = router;
