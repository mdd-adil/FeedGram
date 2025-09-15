const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');
const mongoose = require('mongoose');

// Get chat history between two users - OPTIMIZED
const getChatHistory = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    const targetUserId = new mongoose.Types.ObjectId(userId);

    try {
        // Single aggregation to get messages with sender info
        const messages = await messageModel.aggregate([
            {
                $match: {
                    $or: [
                        { sender: currentUserId, receiver: targetUserId },
                        { sender: targetUserId, receiver: currentUserId }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'senderInfo',
                    pipeline: [{ $project: { username: 1, avatar: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiver',
                    foreignField: '_id',
                    as: 'receiverInfo',
                    pipeline: [{ $project: { username: 1, avatar: 1 } }]
                }
            },
            {
                $addFields: {
                    sender: { $arrayElemAt: ['$senderInfo', 0] },
                    receiver: { $arrayElemAt: ['$receiverInfo', 0] }
                }
            },
            {
                $project: {
                    senderInfo: 0,
                    receiverInfo: 0
                }
            },
            {
                $sort: { timestamp: 1 }
            },
            {
                $limit: 50
            }
        ]);

        res.status(200).json({ messages });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
};

// Get list of users to chat with (ONLY following users + users with existing chat history) - OPTIMIZED
const getChatUsers = async (req, res) => {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);

    try {
        // First, get users with chat history efficiently
        const chatUserIds = await messageModel.aggregate([
            {
                $match: {
                    $or: [
                        { sender: currentUserId },
                        { receiver: currentUserId }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", currentUserId] },
                            "$receiver",
                            "$sender"
                        ]
                    }
                }
            },
            {
                $match: {
                    _id: { $ne: currentUserId }
                }
            }
        ]);

        const chatUserIdsList = chatUserIds.map(item => item._id);

        // Single aggregation to get all eligible users with their data
        const users = await userModel.aggregate([
            {
                $match: {
                    _id: { $ne: currentUserId },
                    $or: [
                        { followers: currentUserId }, // Users following current user
                        { following: currentUserId }, // Users you are following
                        { _id: { $in: chatUserIdsList } } // Users with chat history
                    ]
                }
            },
            {
                $addFields: {
                    isFollowing: { $in: [currentUserId, '$followers'] },
                    chatHistory: { $in: ['$_id', chatUserIdsList] }
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ['$sender', currentUserId] },
                                                { $eq: ['$receiver', '$$userId'] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ['$sender', '$$userId'] },
                                                { $eq: ['$receiver', currentUserId] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 1 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sender',
                                foreignField: '_id',
                                as: 'senderInfo',
                                pipeline: [{ $project: { username: 1 } }]
                            }
                        },
                        { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } }
                    ],
                    as: 'lastMessageData'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$sender', '$$userId'] },
                                        { $eq: ['$receiver', currentUserId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadData'
                }
            },
            {
                $addFields: {
                    lastMessage: {
                        $let: {
                            vars: { msg: { $arrayElemAt: ['$lastMessageData', 0] } },
                            in: {
                                $cond: [
                                    { $ne: ['$$msg', null] },
                                    {
                                        message: '$$msg.message',
                                        timestamp: '$$msg.timestamp',
                                        senderName: '$$msg.senderInfo.username',
                                        senderId: '$$msg.sender'
                                    },
                                    null
                                ]
                            }
                        }
                    },
                    unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadData.count', 0] }, 0] }
                }
            },
            {
                $project: {
                    username: 1,
                    avatar: 1,
                    isFollowing: 1,
                    chatHistory: 1,
                    lastMessage: 1,
                    unreadCount: 1,
                    sortTimestamp: { $ifNull: ['$lastMessage.timestamp', new Date(0)] }
                }
            },
            {
                $sort: { sortTimestamp: -1 }
            },
            {
                $project: { sortTimestamp: 0 }
            }
        ]);

        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Send a message (used by socket.io as well) - OPTIMIZED
const sendMessage = async (senderId, receiverId, messageText) => {
    try {
        // Create message and populate in single operation
        const newMessage = await messageModel.create({
            sender: senderId,
            receiver: receiverId,
            message: messageText
        });

        // Use aggregation to get populated message
        const [populatedMessage] = await messageModel.aggregate([
            { $match: { _id: newMessage._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'sender',
                    pipeline: [{ $project: { username: 1, avatar: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiver',
                    foreignField: '_id',
                    as: 'receiver',
                    pipeline: [{ $project: { username: 1, avatar: 1 } }]
                }
            },
            {
                $addFields: {
                    sender: { $arrayElemAt: ['$sender', 0] },
                    receiver: { $arrayElemAt: ['$receiver', 0] }
                }
            }
        ]);

        return populatedMessage;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    try {
        await messageModel.updateMany(
            { sender: userId, receiver: currentUserId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Error marking messages as read' });
    }
};

// Get specific user for direct messaging (even if not following) - OPTIMIZED
const getDirectMessageUser = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    const targetUserId = new mongoose.Types.ObjectId(userId);

    try {
        // Single aggregation to get user with chat info
        const [userWithChatInfo] = await userModel.aggregate([
            {
                $match: { _id: targetUserId }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ['$sender', currentUserId] },
                                                { $eq: ['$receiver', '$$userId'] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ['$sender', '$$userId'] },
                                                { $eq: ['$receiver', currentUserId] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 1 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sender',
                                foreignField: '_id',
                                as: 'senderInfo',
                                pipeline: [{ $project: { username: 1 } }]
                            }
                        },
                        { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } }
                    ],
                    as: 'lastMessageData'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$sender', '$$userId'] },
                                        { $eq: ['$receiver', currentUserId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadData'
                }
            },
            {
                $project: {
                    username: 1,
                    avatar: 1,
                    lastMessage: {
                        $let: {
                            vars: { msg: { $arrayElemAt: ['$lastMessageData', 0] } },
                            in: {
                                $cond: [
                                    { $ne: ['$$msg', null] },
                                    {
                                        message: '$$msg.message',
                                        timestamp: '$$msg.timestamp',
                                        senderName: '$$msg.senderInfo.username',
                                        senderId: '$$msg.sender'
                                    },
                                    null
                                ]
                            }
                        }
                    },
                    unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadData.count', 0] }, 0] }
                }
            }
        ]);
        
        if (!userWithChatInfo) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user: userWithChatInfo });
    } catch (error) {
        console.error('Error fetching user for direct message:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};

module.exports = {
    getChatHistory,
    getChatUsers,
    sendMessage,
    markAsRead,
    getDirectMessageUser
};
