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
        type: String, // Store base64 image data
        default: null
    },
    likes:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default:[]
       
       
    }],
    timestamp: { type: Date, default: Date.now }
    })
    module.exports = mongoose.model('Post', postSchema);