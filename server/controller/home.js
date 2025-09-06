
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");
const mongoose = require('mongoose');

const finder = async (req, res) => {
    try {
        const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
        
        // Single aggregation to get visible posts based on privacy settings
        const visiblePosts = await postModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo',
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                isPrivate: 1,
                                followers: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $addFields: {
                    isOwnPost: { $eq: ['$user', currentUserId] },
                    isPublic: { $eq: ['$userInfo.isPrivate', false] },
                    isFollower: { $in: [currentUserId, '$userInfo.followers'] }
                }
            },
            {
                $match: {
                    $or: [
                        { isOwnPost: true },           // Own posts
                        { isPublic: true },           // Public posts
                        {                             // Private posts where user is follower
                            $and: [
                                { 'userInfo.isPrivate': true },
                                { isFollower: true }
                            ]
                        }
                    ]
                }
            },
            {
                $addFields: {
                    user: '$userInfo'  // Replace user ObjectId with user info
                }
            },
            {
                $project: {
                    userInfo: 0,
                    isOwnPost: 0,
                    isPublic: 0,
                    isFollower: 0
                }
            },
            {
                $sort: { timestamp: -1, likes: 1 }
            },
            {
                $limit: 50
            }
        ]);
        
        if (!visiblePosts || visiblePosts.length === 0) {
            return res.status(200).json({ posts: [] });
        }
        
        res.status(200).json({ posts: visiblePosts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = finder;