const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');
const mongoose = require('mongoose');

// Get chat history between two users
const getChatHistory = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    try {
        const messages = await messageModel.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar')
        .sort({ timestamp: 1 })
        .limit(50);

        res.status(200).json({ messages });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
};

// Get list of users to chat with
const getChatUsers = async (req, res) => {
    const currentUserId = req.user.userId;

    try {
        // Get all users except current user
        const users = await userModel.find({ 
            _id: { $ne: currentUserId } 
        }).select('username avatar');

        // Get last message and unread count for each user
        const usersWithChatInfo = await Promise.all(users.map(async (user) => {
            // Get last message between current user and this user
            const lastMessage = await messageModel.findOne({
                $or: [
                    { sender: currentUserId, receiver: user._id },
                    { sender: user._id, receiver: currentUserId }
                ]
            })
            .sort({ timestamp: -1 })
            .populate('sender', 'username');

            // Get unread count (messages from this user to current user that are unread)
            const unreadCount = await messageModel.countDocuments({
                sender: user._id,
                receiver: currentUserId,
                isRead: false
            });

            return {
                ...user.toObject(),
                lastMessage: lastMessage ? {
                    message: lastMessage.message,
                    timestamp: lastMessage.timestamp,
                    senderName: lastMessage.sender.username,
                    senderId: lastMessage.sender._id
                } : null,
                unreadCount
            };
        }));

        // Sort users by last message timestamp (most recent first)
        usersWithChatInfo.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
        });

        res.status(200).json({ users: usersWithChatInfo });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Send a message (used by socket.io as well)
const sendMessage = async (senderId, receiverId, messageText) => {
    try {
        const newMessage = await messageModel.create({
            sender: senderId,
            receiver: receiverId,
            message: messageText
        });

        const populatedMessage = await messageModel.findById(newMessage._id)
            .populate('sender', 'username avatar')
            .populate('receiver', 'username avatar');

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

module.exports = {
    getChatHistory,
    getChatUsers,
    sendMessage,
    markAsRead
};
