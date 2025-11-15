const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, verifyResetOtp, resetPassword, sendSignupOtp, verifySignupOtp, completeSignup, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// forgot-password feature removed

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
// Signup verification endpoints
router.post('/signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/complete-signup', completeSignup);
router.get('/me', protect, getMe);

module.exports = router;