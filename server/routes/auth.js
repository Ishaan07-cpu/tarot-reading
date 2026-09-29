const express = require('express');
const router = express.Router();
const {
  signup, verifyOtp, resendOtp,
  login, getMe, updateProfile, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/signup', authLimiter, signup);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
