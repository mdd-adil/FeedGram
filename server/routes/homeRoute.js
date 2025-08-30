const express=require("express");
const router=require("express").Router();
const finder=require("../controller/home")
router.get('/',finder);
module.exports=router;