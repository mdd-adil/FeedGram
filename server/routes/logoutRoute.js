const express = require('express');
const router = express.Router();
const logoutUser=require('../controller/logout');
const isLoggedIn = require('../middleware/isLoggedIn');
router.post('/',isLoggedIn,logoutUser);
module.exports=router;