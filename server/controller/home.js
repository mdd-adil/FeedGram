
const postModel=require("../models/postModel");

const finder=async (req,res)=>{
try {
    const posts = await postModel.find()
        .populate('user', 'username avatar') // Populate user data with username and avatar
        .sort({timestamp:-1, likes:1})
        .limit(20);
    
    if(!posts) return res.status(401).json({message: "Posts not found"});
    
    res.status(200).json({posts});
} catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({message: "Server error"});
}
}
module.exports=finder;