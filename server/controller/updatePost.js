const mongoose = require("mongoose");
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;
  const userId = req.user.userId;
  
  try {
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // Convert userId to ObjectId
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Find the post
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user owns the post
    if (post.user.toString() !== userIdObj.toString()) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    // Handle image upload
    let imageData = post.image; // Keep existing image by default
    if (req.file) {
      // Convert buffer to base64 for new image
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Update the post
    const updatedPost = await postModel.findByIdAndUpdate(
      postId,
      {
        title,
        content,
        image: imageData
      },
      { new: true, runValidators: true }
    ).populate('user', 'username avatar');

    res.status(200).json({ 
      message: "Post updated successfully",
      post: updatedPost 
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: "Error updating post. Please try again." });
  }
};

// Get single post for editing
const getPostForEdit = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  
  try {
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    // Convert userId to ObjectId
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Find the post
    const post = await postModel.findById(postId).populate('user', 'username avatar');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user owns the post
    if (post.user._id.toString() !== userIdObj.toString()) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    res.status(200).json({ post });

  } catch (error) {
    console.error('Get post for edit error:', error);
    res.status(500).json({ message: "Error fetching post. Please try again." });
  }
};

module.exports = { updatePost, getPostForEdit };
