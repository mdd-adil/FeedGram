const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { formatPhoneNumber } = require('../config/twilioService');

const loginUser = async (req, res) => {
  const { email, identifier, phone, password } = req.body;
  const loginIdentifier = (identifier || email || phone || '').toString().trim();

  try {
    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const formattedPhone = formatPhoneNumber(loginIdentifier);

    // Find user by email, phone, or username
    const user = await userModel.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { phone: loginIdentifier },
        { phone: formattedPhone },
        { username: loginIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your username, email, or phone.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, phone: user.phone },
      process.env.SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({ token, user: { _id: user._id, username: user.username, email: user.email, phone: user.phone } });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = loginUser;