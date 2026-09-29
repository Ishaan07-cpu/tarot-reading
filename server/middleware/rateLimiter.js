const rateLimit = require('express-rate-limit');

// Strict limiter for authentication routes (login & signup)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// General API limiter to prevent denial of service
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests sent. Please calm your energy and try again shortly.',
  },
});

module.exports = { authLimiter, apiLimiter };
