const mongoose = require('mongoose');
const userModel = require('../models/userModel');
const { cloudinary } = require('../config/cloudinary');

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

        // Handle profile picture upload - Cloudinary returns URL directly
        let avatarUrl = user.avatar; // Keep existing avatar if no new one
        let avatarCloudinaryId = user.avatarCloudinaryId;
        
        if (req.file) {
            // Delete old avatar from Cloudinary if exists
            if (user.avatarCloudinaryId) {
                try {
                    await cloudinary.uploader.destroy(user.avatarCloudinaryId);
                } catch (err) {
                    console.log('Error deleting old avatar:', err.message);
                }
            }
            avatarUrl = req.file.path; // Cloudinary URL
            avatarCloudinaryId = req.file.filename; // Cloudinary public_id
        }

        // Update user fields
        const updateData = {
            avatar: avatarUrl,
            avatarCloudinaryId: avatarCloudinaryId
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
