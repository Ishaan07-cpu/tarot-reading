const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isEmailConfigured, sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'tarot_cosmic_secret_key_8492049281', {
    expiresIn: '7d',
  });

// ── Signup: create account & generate OTP ───────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail }).select('+password +otp +otpExpiry');

    // If account already exists and is verified
    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered and verified. Please log in.',
      });
    }

    // If account exists but is unverified, update their credentials and send fresh OTP
    if (user && !user.isVerified) {
      user.name = name.trim();
      user.password = password; // pre-save hook will hash it
    } else {
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        password,
        isVerified: false,
      });
    }

    const otp = user.generateOTP();
    await user.save();

    console.log(`✨ [Auth] User saved in MongoDB: ${user.email} (isVerified: false)`);

    // Dispatch OTP email
    const emailResult = await sendOTPEmail(user.email, user.name, otp);

    return res.status(201).json({
      success: true,
      message: emailResult.success
        ? 'Account created! Please check your email for the 6-digit verification code.'
        : 'Account created in database! Verification code ready.',
      email: user.email,
      emailSent: emailResult.success,
      devOtp: emailResult.success ? undefined : otp,
    });
  } catch (error) {
    next(error);
  }
};

// ── Verify OTP ─────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified. Please log in.' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found. Please click Resend OTP for a fresh code.',
      });
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'This verification code has expired. Please click Resend OTP to receive a new one.',
      });
    }

    // Validate hash
    if (!user.verifyOTP(otp.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect 6-digit code. Please verify the code and try again.',
      });
    }

    // Activate account in MongoDB
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    console.log(`🎉 [Auth] Account activated in MongoDB: ${user.email}`);

    // Send welcome email in background
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome to the cosmos, ${user.name}! Your account is activated. ✦`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        bio: user.bio || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Resend OTP ─────────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please log in.' });
    }

    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendOTPEmail(user.email, user.name, otp);

    return res.status(200).json({
      success: true,
      message: emailResult.success
        ? 'A fresh 6-digit code has been sent to your email.'
        : 'A fresh verification code has been generated.',
      emailSent: emailResult.success,
      devOtp: emailResult.success ? undefined : otp,
    });
  } catch (error) {
    next(error);
  }
};

// ── Login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password +otp +otpExpiry');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If account has not verified email yet, issue fresh OTP and redirect
    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save({ validateBeforeSave: false });

      const emailResult = await sendOTPEmail(user.email, user.name, otp);

      return res.status(403).json({
        success: false,
        message: 'Your account requires email verification before accessing the portal.',
        needsVerification: true,
        email: user.email,
        emailSent: emailResult.success,
        devOtp: emailResult.success ? undefined : otp,
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! ✦`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        bio: user.bio || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Current Logged-in User Profile ─────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── Update Profile ─────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully in the celestial records! ✦',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        bio: user.bio || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Change Password ────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully! ✦' });
  } catch (error) {
    next(error);
  }
};
