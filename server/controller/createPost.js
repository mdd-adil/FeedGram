const mongoose = require("mongoose");
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

const post = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.userId;
  
  try {
    if (!title || !content || !userId) {
      return res
        .status(400)
        .json({ message: "Title, body and userId are required" });
    }
    
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Get user document to access username
    const user = await userModel.findById(userIdObj);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle image upload - Cloudinary returns URL directly
    let imageUrl = null;
    let cloudinaryId = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
      cloudinaryId = req.file.filename; // Cloudinary public_id for deletion
    }

    const newPost = await postModel.create({
      title,
      content,
      user: userIdObj,
      username: user.username,
      image: imageUrl,
      cloudinaryId: cloudinaryId
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
 
if (!Array.isArray(user.post)) {
  user.post = [];
}
user.post.push(newPost._id);



    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = post;
