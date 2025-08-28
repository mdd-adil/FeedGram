const mongoose = require("mongoose");
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");
const isLoggedIn = require("../middleware/isLoggedIn");
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
    const newPost = await postModel.create({
      title,
      content,
      userId: userIdObj,
    });
    const user = await userModel.findById(userIdObj);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.post.push(newPost._id);
    await user.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = post;
