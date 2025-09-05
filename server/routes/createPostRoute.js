const createPost=require('../controller/createPost');
const express=require('express');
const router=express.Router();
const isLoggedIn=require('../middleware/isLoggedIn');
const upload=require('../middleware/upload');

router.post('/', isLoggedIn, upload.single('image'), createPost);
module.exports=router;