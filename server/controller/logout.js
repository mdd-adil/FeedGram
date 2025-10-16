const express = require('express');
const router = express.Router();
const logoutUser = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).send({ message: 'Logged out successfully' });
}
module.exports = logoutUser;