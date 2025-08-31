const express=require("express");
const router=require("express").Router();
const finder=require("../controller/home");
const isLoggedIn = require("../middleware/isLoggedIn");
router.get('/',isLoggedIn,finder);
module.exports=router;