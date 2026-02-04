const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, googleSignIn, googleSignUp, forgotPassword, verifyResetOtp, resetPassword, sendSignupOtp, verifySignupOtp, completeSignup } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-signin', googleSignIn); // Google Sign In (login only)
router.post('/google-signup', googleSignUp); // Google Sign Up (create account only)
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/complete-signup', completeSignup);

module.exports = router;