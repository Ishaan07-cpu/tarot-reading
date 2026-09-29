const Appointment = require('../models/Appointment');

// @desc    Create a new tarot appointment booking in MongoDB
// @route   POST /api/appointments
exports.createAppointment = async (req, res, next) => {
  try {
    const { name, email, phone, service, date, time, message } = req.body;

    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, service, date, and time.',
      });
    }

    // Validate that the date is not in the past
    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past. The cosmos invites you forward.',
      });
    }

    // Create the booking document in MongoDB
    const appointment = await Appointment.create({
      user: req.user ? req.user._id : null,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: (phone || '').trim(),
      service,
      date,
      time,
      message: (message || '').trim(),
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Your reading appointment has been sacredly recorded in MongoDB! ✦',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for the logged-in user
// @route   GET /api/appointments/my
exports.getMyAppointments = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to view your appointments.',
      });
    }

    const appointments = await Appointment.find({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments (admin or optional filter)
// @route   GET /api/appointments
exports.getAllAppointments = async (req, res, next) => {
  try {
    const filter = {};

    // If regular authenticated user, only show their bookings
    if (req.user && req.user.role !== 'admin') {
      filter.$or = [{ user: req.user._id }, { email: req.user.email }];
    } else if (!req.user) {
      // If unauthenticated guest request, require email query
      if (req.query.email) {
        filter.email = req.query.email.toLowerCase().trim();
      } else {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view all appointments.',
        });
      }
    }

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    // Verify ownership if not admin
    if (
      req.user &&
      req.user.role !== 'admin' &&
      appointment.email !== req.user.email &&
      (!appointment.user || !appointment.user.equals(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this appointment.',
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment has been cancelled successfully.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
