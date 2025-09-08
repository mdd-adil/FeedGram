const userModel = require('../models/userModel');
const postModel = require('../models/postModel');

const deleteAccount = async (req, res) => {
    const userId = req.user.userId;
    try {
        // Delete all posts by the user
        await postModel.deleteMany({ user: userId });
        // Delete the user
        await userModel.findByIdAndDelete(userId);
        // Optionally: Remove user from followers/following lists of other users
        await userModel.updateMany(
            { followers: userId },
            { $pull: { followers: userId } }
        );
        await userModel.updateMany(
            { following: userId },
            { $pull: { following: userId } }
        );
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = deleteAccount;
