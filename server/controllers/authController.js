const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id, username) => {
    return jwt.sign({ user: { id, username } }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User with that email already exists' });
        }
        
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ msg: 'Username is already taken' });
        }

        const user = await User.create({
            username,
            email,
            passwordHash: password,
        });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id, user.username),
            });
        } else {
            res.status(400).json({ msg: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                token: generateToken(user._id, user.username),
            });
        } else {
            res.status(401).json({ msg: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};