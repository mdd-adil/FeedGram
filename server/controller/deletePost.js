const mongoose = require('mongoose');
const Post = require('../models/postModel');
const User = require('../models/userModel');

const deletePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.user.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(postId);

        // Remove the post reference from the user's posts array
        await User.findByIdAndUpdate(userId, { $pull: { post: postId } });

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = deletePost;