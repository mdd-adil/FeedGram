const createPost=require('../controller/createPost');
const express=require('express');
const router=express.Router();
const isLoggedIn=require('../middleware/isLoggedIn');
router.post('/',createPost);
module.exports=router;