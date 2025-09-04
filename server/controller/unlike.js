const mongoose = require('mongoose');
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

const unlike = async (req, res) => {
    const postId = req.params.id;
    
    if (!req.user) {
        return res.status(401).json({message: "User not authenticated"});
    }
    
    const userId = req.user.userId;
    try {
        if (!postId || !userId) {
            return res.status(400).json({ message: "postId and userId are required" });
        }
        const postIdObj = new mongoose.Types.ObjectId(postId);
        const userIdObj = new mongoose.Types.ObjectId(userId);
        const post = await postModel.findById(postIdObj);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        // Check if user has liked the post
        const likedIndex = post.likes.findIndex(id => id.toString() === userIdObj.toString());
        if (likedIndex === -1) {
            return res.status(400).json({ message: "You have not liked this post" });
        }
        post.likes.splice(likedIndex, 1); // Remove the like
        await post.save();
        res.status(200).json({ message: "Post unliked successfully", post });
    } catch (error) {
        console.error("Unlike error:", error);
        res.status(500).json({ message: "Server error" });
    }
}
module.exports = unlike;