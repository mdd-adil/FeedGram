const profile=require('../controller/profile');
const express=require('express');
const router=express.Router();
const isLoggedIn=require('../middleware/isLoggedIn');
router.get('/',profile);
module.exports=router;