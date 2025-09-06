const userModel = require('../models/userModel');
const postModel = require('../models/postModel');

const viewUserProfile = async (req, res) => {
    const currentUserId = req.user.userId;
    const { userId } = req.params;
    
    try {
        // First get the target user with pending requests
        const user = await userModel.findById(userId)
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if current user can view this profile
        const isOwnProfile = currentUserId === userId;
        const isFollowing = user.followers.some(follower => follower._id.toString() === currentUserId);
        const followRequestSent = user.pendingFollowRequests && user.pendingFollowRequests.includes(currentUserId);
        const canViewProfile = !user.isPrivate || isOwnProfile || isFollowing;

        // If it's a private profile and user can't view it
        if (!canViewProfile) {
            return res.status(200).json({ 
                message: 'This account is private',
                user: {
                    _id: user._id,
                    username: user.username,
                    avatar: user.avatar,
                    isPrivate: user.isPrivate,
                    followersCount: user.followers.length,
                    followingCount: user.following.length
                },
                posts: [],
                isFollowing: false,
                followRequestSent: followRequestSent,
                canViewPosts: false
            });
        }

        // Get posts if profile is viewable
        const posts = await postModel.find({ user: userId })
            .populate('user', 'username avatar')
            .sort({ timestamp: -1 });
        
        // Return user data without sensitive fields
        const userData = {
            _id: user._id,
            username: user.username,
            email: isOwnProfile ? user.email : undefined, // Only show email for own profile
            avatar: user.avatar,
            isPrivate: user.isPrivate,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            followers: user.followers,
            following: user.following
        };
        
        return res.status(200).json({
            message: 'Profile retrieved successfully',
            user: userData,
            posts: canViewProfile ? posts : [],
            isFollowing: isFollowing,
            followRequestSent: followRequestSent,
            canViewPosts: canViewProfile
        });
    } catch (error) {
        console.error('View user profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    viewUserProfile
};
