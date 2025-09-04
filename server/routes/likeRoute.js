const express=require("express");
const like=require("../controller/like");
const isLoggedIn=require("../middleware/isLoggedIn");
const router=express.Router();
router.post('/:id', isLoggedIn, like);
module.exports=router;