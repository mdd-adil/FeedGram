const profile=require('../controller/profile');
const express=require('express');
const isLoggedIn = require('../middleware/isLoggedIn');
const router=express.Router();

router.get('/',isLoggedIn,profile);
module.exports=router;