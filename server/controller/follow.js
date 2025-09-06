const userModel = require('../models/userModel');

// Follow a user
const followUser = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { targetUserId } = req.params;

        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const currentUser = await userModel.findById(currentUserId);
        const targetUser = await userModel.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already following
        if (currentUser.following.includes(targetUserId)) {
            return res.status(400).json({ message: "Already following this user" });
        }

        if (targetUser.isPrivate) {
            // For private accounts, send follow request
            if (!targetUser.pendingFollowRequests.includes(currentUserId)) {
                targetUser.pendingFollowRequests.push(currentUserId);
                await targetUser.save();
            }
            res.status(200).json({ 
                message: "Follow request sent", 
                status: "pending" 
            });
        } else {
            // For public accounts, follow immediately
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
            
            await currentUser.save();
            await targetUser.save();
            
            res.status(200).json({ 
                message: "Successfully followed user", 
                status: "following" 
            });
        }
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { targetUserId } = req.params;

        const currentUser = await userModel.findById(currentUserId);
        const targetUser = await userModel.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from following/followers
        currentUser.following = currentUser.following.filter(
            id => id.toString() !== targetUserId
        );
        targetUser.followers = targetUser.followers.filter(
            id => id.toString() !== currentUserId
        );

        // Remove from pending requests if exists
        targetUser.pendingFollowRequests = targetUser.pendingFollowRequests.filter(
            id => id.toString() !== currentUserId
        );

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ 
            message: "Successfully unfollowed user", 
            status: "not_following" 
        });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Accept follow request
const acceptFollowRequest = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { requesterId } = req.params;

        const currentUser = await userModel.findById(currentUserId);
        const requesterUser = await userModel.findById(requesterId);

        if (!requesterUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if request exists
        if (!currentUser.pendingFollowRequests.includes(requesterId)) {
            return res.status(400).json({ message: "No pending follow request from this user" });
        }

        // Add to followers/following
        currentUser.followers.push(requesterId);
        requesterUser.following.push(currentUserId);

        // Remove from pending requests
        currentUser.pendingFollowRequests = currentUser.pendingFollowRequests.filter(
            id => id.toString() !== requesterId
        );

        await currentUser.save();
        await requesterUser.save();

        res.status(200).json({ message: "Follow request accepted" });
    } catch (error) {
        console.error('Accept follow request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reject follow request
const rejectFollowRequest = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { requesterId } = req.params;

        const currentUser = await userModel.findById(currentUserId);

        if (!currentUser.pendingFollowRequests.includes(requesterId)) {
            return res.status(400).json({ message: "No pending follow request from this user" });
        }

        // Remove from pending requests
        currentUser.pendingFollowRequests = currentUser.pendingFollowRequests.filter(
            id => id.toString() !== requesterId
        );

        await currentUser.save();

        res.status(200).json({ message: "Follow request rejected" });
    } catch (error) {
        console.error('Reject follow request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get follow requests
const getFollowRequests = async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        const currentUser = await userModel.findById(currentUserId)
            .populate('pendingFollowRequests', 'username avatar');

        res.status(200).json({ 
            requests: currentUser.pendingFollowRequests 
        });
    } catch (error) {
        console.error('Get follow requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get follow status
const getFollowStatus = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { targetUserId } = req.params;

        const currentUser = await userModel.findById(currentUserId);
        const targetUser = await userModel.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        let status = "not_following";
        
        if (currentUser.following.includes(targetUserId)) {
            status = "following";
        } else if (targetUser.pendingFollowRequests.includes(currentUserId)) {
            status = "pending";
        }

        res.status(200).json({ 
            status,
            isPrivate: targetUser.isPrivate,
            followersCount: targetUser.followers.length,
            followingCount: targetUser.following.length
        });
    } catch (error) {
        console.error('Get follow status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle account privacy
const toggleAccountPrivacy = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const currentUser = await userModel.findById(currentUserId);

        const previousPrivacy = currentUser.isPrivate;
        currentUser.isPrivate = !currentUser.isPrivate;
        await currentUser.save();

        let message;
        if (currentUser.isPrivate) {
            message = 'Account is now private. Only your followers can see your posts.';
        } else {
            message = 'Account is now public. Anyone can see your posts.';
        }

        res.status(200).json({ 
            message: message,
            isPrivate: currentUser.isPrivate,
            previousPrivacy: previousPrivacy
        });
    } catch (error) {
        console.error('Toggle privacy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get followers list
const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const user = await userModel.findById(userId)
            .populate('followers', 'username avatar');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if current user can view followers
        if (user.isPrivate && userId !== currentUserId && !user.followers.includes(currentUserId)) {
            return res.status(403).json({ message: "This account is private" });
        }

        res.status(200).json({ followers: user.followers });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get following list
const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const user = await userModel.findById(userId)
            .populate('following', 'username avatar');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if current user can view following
        if (user.isPrivate && userId !== currentUserId && !user.followers.includes(currentUserId)) {
            return res.status(403).json({ message: "This account is private" });
        }

        res.status(200).json({ following: user.following });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    getFollowRequests,
    getFollowStatus,
    toggleAccountPrivacy,
    getFollowers,
    getFollowing
};
