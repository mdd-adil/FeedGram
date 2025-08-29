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
    post:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        
    }]
})
    module.exports = mongoose.model('User', userSchema);