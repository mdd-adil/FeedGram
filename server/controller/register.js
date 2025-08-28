const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const userModel=require('../models/userModel');



const registerUser=async (req,res)=>{
    const {username,email,password}=req.body;
    try {
        if(!username || !email || !password){
            return res.status(400).json({message:'Name, email and password are required'});
        }
        const existingUser=await userModel.findOne({email});
        if(existingUser){
            return res.status(409).json({message:'User already exists'});
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const newUser=await userModel.create({
            username,
            email,
            password:hashedPassword
        });
        res.status(201).json({message:'User registered successfully'});
    } catch (error) {
        console.error('Registration error:',error);
        res.status(500).json({message:'Server error'});
    }
}
module.exports=registerUser;
