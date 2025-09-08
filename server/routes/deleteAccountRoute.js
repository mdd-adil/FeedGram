const express = require('express');
const isLoggedIn = require('../middleware/isLoggedIn');
const deleteAccount = require('../controller/deleteAccount');
const router = express.Router();

router.delete('/', isLoggedIn, deleteAccount);

module.exports = router;
