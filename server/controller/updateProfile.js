const mongoose = require('mongoose');
const userModel = require('../models/userModel');

const updateProfile = async (req, res) => {
    const userId = req.user.userId;
    const { username, email } = req.body;

    try {
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const user = await userModel.findById(userIdObj);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Handle profile picture upload
        let avatarData = user.avatar; // Keep existing avatar if no new one
        if (req.file) {
            // Convert buffer to base64
            avatarData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Update user fields
        const updateData = {
            avatar: avatarData
        };

        if (username) updateData.username = username;
        if (email) updateData.email = email;

        const updatedUser = await userModel.findByIdAndUpdate(
            userIdObj,
            updateData,
            { new: true, select: '-password' }
        );

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = updateProfile;
