const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const SignupIntent = require('../models/SignupIntent');
const logger = require('../utils/logger');

// Helper function to generate JWT
const generateToken = (id, username, isAdmin = false) => {
    return jwt.sign({ user: { id, username, isAdmin } }, process.env.JWT_SECRET, {
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

        // Validate username length
        if (username.trim().length > 10) {
            return res.status(400).json({ msg: 'Username cannot be more than 10 characters' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User with that email already exists' });
        }
        
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ msg: 'Username is already taken' });
        }

        if (!validatePassword(password)) return res.status(400).json({ msg: 'Password does not meet complexity requirements' });

        const user = await User.create({
            username,
            email,
            passwordHash: password,
            avatar: '/default_dp.png',
        });

        if (user) {
            // Award new user badge
            await handleNewUser(user._id);
            
            res.status(201).json({
                token: generateToken(user._id, user.username, user.isAdmin),
            });
        } else {
            res.status(400).json({ msg: 'Invalid user data' });
        }
    } catch (error) {
        logger.error(error);
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
                    logger.error('Failed to save default avatar for user on login', e);
                }
            }

            res.json({
                token: generateToken(user._id, user.username, user.isAdmin),
            });
        } else {
            res.status(401).json({ msg: 'Invalid email or password' });
        }
    } catch (error) {
        logger.error(error);
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
    if (!user) return res.status(404).json({ msg: 'User does not exist' });

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

        // Allow printing OTPs to server logs for debugging/testing when in dev
        // or when explicitly enabled via SHOW_OTPS=true in env (useful for hosted test instances)
        const isDev = process.env.NODE_ENV !== 'production';
        const showOtps = process.env.SHOW_OTPS === 'true' || isDev;

        let emailSent = false;
        try {
            await sendEmail({ to: user.email, subject, text, html });
            emailSent = true;
        } catch (e) {
            logger.error('Failed to send reset email', e);
            emailSent = false;
            // still return success to avoid revealing whether sending failed
        }

        if (showOtps || !emailSent) {
            try {
                logger.info(`[forgot-password] OTP for ${user.email}: ${otp} ${!emailSent ? '(email send failed)' : '(logged)'}`);
            } catch (e) {
                // ignore logging errors
            }
        }

        return res.json({ msg: 'If that email exists we sent an OTP' });
    } catch (err) {
        logger.error(err);
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
        logger.error(err);
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

    // Validate new password
    if (!validatePassword(newPassword)) return res.status(400).json({ msg: 'Password does not meet complexity requirements' });

    // Set new password
    user.passwordHash = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save();

        return res.json({ msg: 'Password reset successful' });
    } catch (err) {
        logger.error(err);
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
    // Accept country/state but normalize/validate them before storing
    let { country, state } = req.body;
    if (!username || !email || !password) return res.status(400).json({ msg: 'username, email and password required' });
    
    // Validate username length
    if (username.trim().length > 10) {
        return res.status(400).json({ msg: 'Username cannot be more than 10 characters' });
    }

    // small helpers
    const normalizeCountry = (c) => {
        if (!c || typeof c !== 'string') return '';
        const trimmed = c.trim();
        if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
        // if client sent a full name (unlikely) just return trimmed (server will accept but not uppercase)
        return trimmed;
    };
    const titleCase = (s) => typeof s === 'string' && s.trim() ? s.trim().split(/\s+/).map(part => part[0]?.toUpperCase() + part.slice(1).toLowerCase()).join(' ') : '';

    country = normalizeCountry(country || '');
    state = titleCase(state || '');

    try {
        // Check if email or username already exist in users
        const existsEmail = await User.findOne({ email });
        if (existsEmail) return res.status(400).json({ msg: 'Email already registered' });
        const existsUsername = await User.findOne({ username });
        if (existsUsername) return res.status(400).json({ msg: 'Username already taken' });

        // Validate password complexity
        if (!validatePassword(password)) return res.status(400).json({ msg: 'Password does not meet complexity requirements' });


        // Remove any previous intent for this email
        await SignupIntent.deleteMany({ email });

        // Hash password for storage in intent
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

    const intent = await SignupIntent.create({ username, email, passwordHash, name, age, country: country || '', state: state || '', otpHash, otpExpires: Date.now() + 15 * 60 * 1000 });

            const subject = 'Verify your email for MovieSocial';
            const text = `Your signup verification code is ${otp}. It expires in 15 minutes.`;
            const html = `<p>Your signup verification code is <strong>${otp}</strong>.</p><p>It expires in 15 minutes.</p>`;

            let emailSent = false;
                    try {
                        await sendEmail({ to: email, subject, text, html });
                        emailSent = true;
                    } catch (e) {
                        logger.error('Failed to send signup otp', e);
                        emailSent = false;
                    }

            // For local development (or when sending failed), log the OTP so devs can test without SMTP configured
            const isDev = process.env.NODE_ENV !== 'production';
            const showOtps = process.env.SHOW_OTPS === 'true' || isDev;
            if (!emailSent || showOtps) {
                try {
                    logger.info(`[signup-otp] OTP for ${email}: ${otp} ${!emailSent ? '(email send failed)' : '(logged)'}`);
                } catch (e) {
                    // ignore logging errors
                }
            }

            return res.json({ msg: 'OTP sent' });
    } catch (err) {
        logger.error(err);
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
        logger.error(err);
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

        // Normalize state and country values before creating user
        const normalize = (s) => typeof s === 'string' ? s.trim() : '';
        const titleCase = (s) => typeof s === 'string' && s.trim() ? s.trim().split(/\s+/).map(part => part[0]?.toUpperCase() + part.slice(1).toLowerCase()).join(' ') : '';
        const countryNormalize = (c) => {
            if (!c || typeof c !== 'string') return '';
            const t = c.trim();
            if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
            return t;
        };

        const countryVal = countryNormalize(intent.country || '');
        const stateVal = titleCase(intent.state || '');
        const regionVal = stateVal || countryVal;

        const user = await User.create({
            username: intent.username,
            email: intent.email,
            passwordHash: finalPasswordHash,
            avatar: '/default_dp.png',
            bio: '',
            country: countryVal || undefined,
            state: stateVal || undefined,
            region: regionVal || undefined,
        });

        // Award new user badge
        await handleNewUser(user._id);

        // Cleanup intent
        await SignupIntent.deleteMany({ email });

        if (!user) return res.status(500).json({ msg: 'Failed to create user' });

        return res.status(201).json({ token: generateToken(user._id, user.username, user.isAdmin) });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// @desc Get current user data
// @route GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server error' });
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
    getMe,
};

// Password policy validator
const validatePassword = (password) => {
    // min 8 chars, at least one uppercase, one lowercase, one digit, one special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return re.test(password);
};