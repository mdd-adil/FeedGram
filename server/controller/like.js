const mongoose=require("mongoose");
const postModel=require("../models/postModel");


const like=async (req,res)=>{
    const postId=req.params.id;
    console.log('req.user:', req.user); // Debug log
    console.log('req.user type:', typeof req.user); // Debug log
    
    if (!req.user) {
        return res.status(401).json({message: "User not authenticated"});
    }
    
    const userId=req.user.userId;
    console.log('userId extracted:', userId); // Debug log
    try {
        if(!postId || !userId){
            return res.status(400).json({message:"postId and userId are required"});
        }
        const postIdObj=new mongoose.Types.ObjectId(postId);
        const userIdObj=new mongoose.Types.ObjectId(userId);
        const post=await postModel.findById(postIdObj);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }
        // Check if user has already liked the post
        if(post.likes.includes(userIdObj)){
            return res.status(400).json({message:"You have already liked this post"});
        }
        post.likes.push(userIdObj);
        await post.save();
        res.status(200).json({message:"Post liked successfully",post});
    } catch (error) {
        console.error("Like error:",error);
        res.status(500).json({message:"Server error"});
    }
}
module.exports=like;