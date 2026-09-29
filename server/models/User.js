const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // ── Email Verification ──────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    // ── Profile extras ─────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default: '',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate a 6-digit OTP, hash & store it, return the plain OTP
UserSchema.methods.generateOTP = function () {
  const plain = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = crypto.createHash('sha256').update(plain).digest('hex');
  this.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return plain;
};

// Verify a submitted OTP against the stored hash
UserSchema.methods.verifyOTP = function (submitted) {
  const hash = crypto.createHash('sha256').update(submitted).digest('hex');
  return hash === this.otp && this.otpExpiry > new Date();
};

// Clean output
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.otp;
    delete ret.otpExpiry;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
