const registerUser=require('../controller/register');
const express=require('express');
const router=express.Router();
router.post('/',registerUser);
module.exports=router;