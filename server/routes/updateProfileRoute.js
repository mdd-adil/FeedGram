const express = require('express');
const router = express.Router();
const updateProfile = require('../controller/updateProfile');
const isLoggedIn = require('../middleware/isLoggedIn');
const { uploadProfileImage } = require('../config/cloudinary');

router.put('/', isLoggedIn, uploadProfileImage.single('avatar'), updateProfile);

module.exports = router;
