
const postModel=require("../models/postModel");
const userModel=require("../models/userModel");

const finder=async (req,res)=>{
try {
    const currentUserId = req.user.userId;
    const currentUser = await userModel.findById(currentUserId);
    
    // Get all posts with populated user data
    const allPosts = await postModel.find()
        .populate('user', 'username avatar isPrivate followers') 
        .sort({timestamp:-1, likes:1})
        .limit(50);
    
    if(!allPosts) return res.status(401).json({message: "Posts not found"});
    
    // Filter posts based on privacy settings
    const visiblePosts = allPosts.filter(post => {
        const postUser = post.user;
        
        // Own posts are always visible
        if (postUser._id.toString() === currentUserId) {
            return true;
        }
        
        // Public accounts - posts are visible to everyone
        if (!postUser.isPrivate) {
            return true;
        }
        
        // Private accounts - posts only visible to followers
        if (postUser.isPrivate && postUser.followers.includes(currentUserId)) {
            return true;
        }
        
        return false;
    });
    
    res.status(200).json({posts: visiblePosts});
} catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({message: "Server error"});
}
}
module.exports=finder;