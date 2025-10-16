const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const SignupIntent = require('../models/SignupIntent');

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

// exports moved to bottom after all functions are defined

// -------------------------
// Signup verification flow
// -------------------------

// @desc Send OTP to email before signup
// @route POST /api/auth/signup-otp
const sendSignupOtp = async (req, res) => {
    const { username, email, password, name, age } = req.body;
    if (!username || !email || !password) return res.status(400).json({ msg: 'username, email and password required' });

    try {
        // Check if email or username already exist in users
        const existsEmail = await User.findOne({ email });
        if (existsEmail) return res.status(400).json({ msg: 'Email already registered' });
        const existsUsername = await User.findOne({ username });
        if (existsUsername) return res.status(400).json({ msg: 'Username already taken' });

        // Remove any previous intent for this email
        await SignupIntent.deleteMany({ email });

        // Hash password for storage in intent
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

            const intent = await SignupIntent.create({ username, email, passwordHash, name, age, otpHash, otpExpires: Date.now() + 15 * 60 * 1000 });

            const subject = 'Verify your email for MovieSocial';
            const text = `Your signup verification code is ${otp}. It expires in 15 minutes.`;
            const html = `<p>Your signup verification code is <strong>${otp}</strong>.</p><p>It expires in 15 minutes.</p>`;

            let emailSent = false;
            try {
                await sendEmail({ to: email, subject, text, html });
                emailSent = true;
            } catch (e) {
                console.error('Failed to send signup otp', e);
                emailSent = false;
            }

            // For local development (or when sending failed), log the OTP so devs can test without SMTP configured
            const isDev = process.env.NODE_ENV !== 'production';
            if (!emailSent || isDev) {
                try {
                    console.info(`[signup-otp] OTP for ${email}: ${otp} (dev/failed-send log)`);
                } catch (e) {
                    // ignore logging errors
                }
            }

            return res.json({ msg: 'OTP sent' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// @desc Verify signup OTP and return signup token
// @route POST /api/auth/verify-signup-otp
const verifySignupOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: 'email and otp required' });

    try {
        const intent = await SignupIntent.findOne({ email });
        if (!intent || !intent.otpHash || !intent.otpExpires) return res.status(400).json({ msg: 'Invalid or expired OTP' });
        if (intent.otpExpires < Date.now()) return res.status(400).json({ msg: 'OTP expired' });

        const match = await bcrypt.compare(otp, intent.otpHash);
        if (!match) return res.status(400).json({ msg: 'Invalid OTP' });

        // Create a signup token for completing signup
        const token = crypto.randomBytes(20).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        intent.signupToken = tokenHash;
        intent.signupTokenExpires = Date.now() + 20 * 60 * 1000;
        intent.otpHash = undefined;
        intent.otpExpires = undefined;
        await intent.save();

        return res.json({ signupToken: token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// @desc Complete signup using signupToken
// @route POST /api/auth/complete-signup
const completeSignup = async (req, res) => {
    const { email, signupToken } = req.body;
    if (!email || !signupToken) return res.status(400).json({ msg: 'email and signupToken required' });

    try {
        const intent = await SignupIntent.findOne({ email });
        if (!intent || !intent.signupToken || !intent.signupTokenExpires) return res.status(400).json({ msg: 'Invalid or expired signup token' });
        if (intent.signupTokenExpires < Date.now()) return res.status(400).json({ msg: 'Signup token expired' });

        const hashed = crypto.createHash('sha256').update(signupToken).digest('hex');
        if (hashed !== intent.signupToken) return res.status(400).json({ msg: 'Invalid signup token' });

        // Create user
        // Ensure the passwordHash in intent is a proper bcrypt hash. If not, hash it defensively.
        let finalPasswordHash = intent.passwordHash;
        const bcryptLike = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
        if (!bcryptLike.test(finalPasswordHash || '')) {
            const salt = await bcrypt.genSalt(10);
            finalPasswordHash = await bcrypt.hash(finalPasswordHash || '', salt);
        }

        const user = await User.create({
            username: intent.username,
            email: intent.email,
            passwordHash: finalPasswordHash,
            avatar: '/default_dp.png',
            bio: '',
        });

        // Cleanup intent
        await SignupIntent.deleteMany({ email });

        if (!user) return res.status(500).json({ msg: 'Failed to create user' });

        return res.status(201).json({ token: generateToken(user._id, user.username) });
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
    sendSignupOtp,
    verifySignupOtp,
    completeSignup,
};