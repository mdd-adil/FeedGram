const deletePost=require('../controller/deletePost');
const express=require('express');
const router=express.Router();
const isLoggedIn=require('../middleware/isLoggedIn');

router.delete('/:id', isLoggedIn, deletePost);
module.exports=router;