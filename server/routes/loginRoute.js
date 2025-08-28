const express = require('express');
const router = express.Router();
const loginUser=require('../controller/login');
router.post('/',loginUser);
module.exports=router;