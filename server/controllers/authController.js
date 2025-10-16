const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');

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
            avatar: '/default_dp.png',
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
            // Ensure a default avatar is present for users signing in
            if (!user.avatar) {
                user.avatar = '/default_dp.png';
                try {
                    await user.save();
                } catch (e) {
                    console.error('Failed to save default avatar for user on login', e);
                }
            }

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

// Export handlers (will be assigned at bottom after additional functions are defined)
// (Forgot password feature removed)

// @desc Send OTP to user's email for password reset
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ msg: 'If that email exists we sent an OTP' });

        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Set expiry (e.g., 15 minutes)
        user.resetOtpHash = otpHash;
        user.resetOtpExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Send email (or log to console if not configured)
        const subject = 'Your password reset code';
        const text = `Your password reset code is: ${otp}. It expires in 15 minutes.`;
        const html = `<p>Your password reset code is: <strong>${otp}</strong></p><p>It expires in 15 minutes.</p>`;

        try {
            await sendEmail({ to: user.email, subject, text, html });
        } catch (e) {
            console.error('Failed to send reset email', e);
            // still return success to avoid revealing whether sending failed
        }

        return res.json({ msg: 'If that email exists we sent an OTP' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// @desc Verify OTP
// @route POST /api/auth/verify-otp
const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: 'Email and otp are required' });

    try {
        const user = await User.findOne({ email });
        if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ msg: 'Invalid or expired OTP' });
        if (user.resetOtpExpires < Date.now()) return res.status(400).json({ msg: 'OTP expired' });

        const match = await bcrypt.compare(otp, user.resetOtpHash);
        if (!match) return res.status(400).json({ msg: 'Invalid OTP' });

        // OTP valid - create a short-lived token for password reset to avoid passing otp around
        const resetToken = crypto.randomBytes(20).toString('hex');
        // store hashed reset token on user with short expiry (e.g., 20 minutes)
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetOtpHash = undefined;
        user.resetOtpExpires = undefined;
        user.passwordResetToken = resetTokenHash;
        user.passwordResetTokenExpires = Date.now() + 20 * 60 * 1000;
        await user.save();

        return res.json({ resetToken });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// @desc Reset password using reset token
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) return res.status(400).json({ msg: 'Missing parameters' });

    try {
        const user = await User.findOne({ email });
        if (!user || !user.passwordResetToken || !user.passwordResetTokenExpires) return res.status(400).json({ msg: 'Invalid or expired reset token' });
        if (user.passwordResetTokenExpires < Date.now()) return res.status(400).json({ msg: 'Reset token expired' });

        const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
        if (hashed !== user.passwordResetToken) return res.status(400).json({ msg: 'Invalid reset token' });

        // Set new password
        user.passwordHash = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save();

        return res.json({ msg: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
};