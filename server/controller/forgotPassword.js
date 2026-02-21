const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const userModel = require('../models/userModel');

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account with that email address exists.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Set token and expiration (1 hour from now)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
        await user.save();

        // Create transporter for sending email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS  // Your email password or app password
            }
        });

        // Email content
        const resetUrl = `https://feedgram-frontende.onrender.com/reset-password/:${resetToken}`;
        
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request - FeedGram',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Password Reset Request</h2>
                    <p>Hello ${user.username},</p>
                    <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                    <div style="margin: 20px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        If the button above doesn't work, copy and paste this link into your browser:<br>
                        ${resetUrl}
                    </p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ 
            message: 'An email has been sent to ' + user.email + ' with further instructions.',
            success: true 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error sending reset email. Please try again.' });
    }
};

module.exports = forgotPassword;
