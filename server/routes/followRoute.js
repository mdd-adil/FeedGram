const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const {
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    getFollowRequests,
    getFollowStatus,
    toggleAccountPrivacy,
    getFollowers,
    getFollowing
} = require('../controller/follow');

// Follow/Unfollow routes
router.post('/follow/:targetUserId', isLoggedIn, followUser);
router.delete('/unfollow/:targetUserId', isLoggedIn, unfollowUser);

// Follow request management
router.post('/accept/:requesterId', isLoggedIn, acceptFollowRequest);
router.delete('/reject/:requesterId', isLoggedIn, rejectFollowRequest);
router.get('/requests', isLoggedIn, getFollowRequests);

// Follow status and privacy
router.get('/status/:targetUserId', isLoggedIn, getFollowStatus);
router.patch('/privacy/toggle', isLoggedIn, toggleAccountPrivacy);

// Get followers/following lists
router.get('/followers/:userId', isLoggedIn, getFollowers);
router.get('/following/:userId', isLoggedIn, getFollowing);

module.exports = router;
