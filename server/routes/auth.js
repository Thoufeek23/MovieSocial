const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');

// forgot-password feature removed

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;