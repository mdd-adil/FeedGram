const createPost=require('../controller/createPost');
const express=require('express');
const router=express.Router();
const isLoggedIn=require('../middleware/isLoggedIn');
const { uploadPostImage } = require('../config/cloudinary');

router.post('/', isLoggedIn, uploadPostImage.single('image'), createPost);
module.exports=router;