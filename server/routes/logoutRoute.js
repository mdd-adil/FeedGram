const express = require('express');
const router = express.Router();
const logoutUser=require('../controller/logout');
router.post('/',logoutUser);
module.exports=router;