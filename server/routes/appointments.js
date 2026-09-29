const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, optionalAuth } = require('../middleware/auth');

// Create appointment (logged-in user or guest)
router.post('/', optionalAuth, createAppointment);

// Logged-in user's appointments
router.get('/my', protect, getMyAppointments);

// Query appointments
router.get('/', optionalAuth, getAllAppointments);

// Cancel an appointment
router.patch('/:id/cancel', optionalAuth, cancelAppointment);

module.exports = router;
