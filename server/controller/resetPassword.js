const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const resetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    
    try {
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Find user with valid reset token
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Token not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user's password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        
        await user.save();

        res.status(200).json({ 
            message: 'Password has been reset successfully. You can now log in with your new password.',
            success: true 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password. Please try again.' });
    }
};

module.exports = resetPassword;
