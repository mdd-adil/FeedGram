const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for post images
const postStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'feedgram/posts',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1080, height: 1080, crop: 'limit', quality: 'auto:good' }
        ]
    }
});

// Storage for profile pictures
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'feedgram/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' }
        ]
    }
});

// Multer upload instances
const uploadPostImage = multer({ 
    storage: postStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadProfileImage = multer({ 
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { 
    cloudinary, 
    uploadPostImage, 
    uploadProfileImage 
};
