const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String, // Cloudinary URL
        default: null
    },
    avatarCloudinaryId: {
        type: String, // Cloudinary public_id for deletion
        default: null
    },
    post: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Post',
        default: []
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingFollowRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

// Indexes for better query performance

userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

module.exports = mongoose.model('User', userSchema);