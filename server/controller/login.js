const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const cookieParser = require('cookie-parser');
const loginUser=async (req, res) => {
const { email, password } = req.body;
try {
    if(!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id ,email:user.email}, process.env.SECRET, { expiresIn: '1h' });
    res.cookie('token', token);
    res.send({ token });
} catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send({ message: 'Server error' }); 
} 
next();
}
module.exports =loginUser ;