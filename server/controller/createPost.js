const mongoose=require('mongoose');
const postModel=require('../models/postModel');
const userModel = require('../models/userModel');
const isLoggedIn=require('../middleware/isLoggedIn');
const post=async (isLoggedIn,req,res)=>{
    const {title,body}=req.body;
    const {userId}=req.params.id;

    try {
        if(!title || !body || !userId){
            return res.status(400).json({message:'Title, body and userId are required'});
        }
        const newPost=await postModel.create({
            title,
            body,
            userId:mongoose.Types.ObjectId(userId)
        });
        const user= await userModel.findById({userId:mongoose.Types.ObjectId(userId)});
        if(!user){
            return res.status(404).json({message:'User not found'});
        }
        user.posts.push(newPost._id);
        await user.save();
        res.status(201).json({message:'Post created successfully',post:newPost});
    } catch (error) {
        console.error('Post creation error:',error);
        res.status(500).json({message:'Server error'});
    }
}
module.exports=post;