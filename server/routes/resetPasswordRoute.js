const express = require('express');
const router = express.Router();
const resetPassword = require('../controller/resetPassword');

router.post('/', resetPassword);

module.exports = router;
