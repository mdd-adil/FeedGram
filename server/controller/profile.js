const mongoose = require('mongoose');
const userModel = require('../models/userModel');
const postModel = require('../models/postModel');
const { post } = require('../routes/loginRoute');
const profile = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await userModel.findById(userId).populate('post');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } const posts = await postModel.find({ userId: userId });
        res.send({ user ,posts});
        res.status(200).json({ message: 'Profile retrieved successfully', posts });
    } catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
module.exports = profile;