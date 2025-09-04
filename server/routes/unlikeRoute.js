const unlike=require("../controller/unlike");
const express=require("express");
const isLoggedIn=require("../middleware/isLoggedIn");
const router=express.Router();
router.post("/:id",isLoggedIn,unlike);
module.exports=router;