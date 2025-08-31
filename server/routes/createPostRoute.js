const createPost=require('../controller/createPost');
const express=require('express');
const router=express.Router();
const isLoggedIn=require('../middleware/isLoggedIn');
router.post('/',isLoggedIn,createPost);
module.exports=router;