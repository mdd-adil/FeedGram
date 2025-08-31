const userModel = require('../models/userModel');
const postModel = require('../models/postModel');

const profile = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await userModel.findById(userId).populate({
            path: 'post',
            populate: {
                path: 'user',
                model: 'User',
                select: 'username avatar' // Selects only necessary fields
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find all posts by the user and populate the user data
        const posts = await postModel.find({ user: userId }).populate('user');
        
        // Combine the user and posts data into a single, clean response
        return res.status(200).json({
            message: 'Profile retrieved successfully',
            user: user,
            posts: posts
        });
    } catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
module.exports = profile;
