const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// forgot-password feature removed

router.post('/register', registerUser);
router.post('/login', loginUser);
// (forgot-password/reset-password routes removed)

module.exports = router;