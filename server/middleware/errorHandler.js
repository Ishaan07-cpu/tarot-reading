// Centralized Error Handling Middleware

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`❌ [Error Handler] ${req.method} ${req.originalUrl}:`, err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `An account with that ${field} already exists. Please use another ${field} or log in.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({ success: false, message });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
  }

  // Default server error
  const statusCode = error.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
