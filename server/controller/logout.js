const express = require('express');
const router = express.Router();
const logoutUser = (req, res) => {
    res.clearCookie('token');
    res.status(200).send({ message: 'Logged out successfully' });
}
module.exports = logoutUser;