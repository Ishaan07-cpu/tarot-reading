const mongoose = require('mongoose');

const VALID_SERVICES = [
  'Love & Relationships (45 min)',
  'Life Path Reading (75 min)',
  'Career & Finance (45 min)',
  'Spiritual Guidance (60 min)',
  'Monthly Forecast (30 min)',
  'Annual Spread (90 min)',
];

const AppointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    service: {
      type: String,
      required: [true, 'Please select a tarot reading service'],
      enum: {
        values: VALID_SERVICES,
        message: '{VALUE} is not a valid tarot reading service',
      },
    },
    date: {
      type: String,
      required: [true, 'Please select your preferred date'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    time: {
      type: String,
      required: [true, 'Please select your preferred time slot'],
      trim: true,
    },
    message: {
      type: String,
      default: '',
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Clean up response objects
AppointmentSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
