const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
    user:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
    },
    
    username:{
type:String,
require:true,
trim:true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String, // Cloudinary URL
        default: null
    },
    cloudinaryId: {
        type: String, // Cloudinary public_id for deletion
        default: null
    },
    likes:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default:[]
    }],
    timestamp: { type: Date, default: Date.now }
});

// Indexes for better query performance
postSchema.index({ user: 1, timestamp: -1 });
postSchema.index({ timestamp: -1 });
postSchema.index({ likes: 1 });

module.exports = mongoose.model('Post', postSchema);