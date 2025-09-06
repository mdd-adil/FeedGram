const userModel = require('../models/userModel');

// Search for users by username
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.userId;

        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Search for users whose username contains the query (case-insensitive)
        const users = await userModel.find({
            username: { $regex: q, $options: 'i' },
            _id: { $ne: currentUserId } // Exclude current user from results
        })
        .select('username avatar isPrivate')
        .limit(10); // Limit to 10 results

        res.status(200).json({
            message: 'Search completed successfully',
            users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    searchUsers
};
