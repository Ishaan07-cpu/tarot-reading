const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tarot_reading';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✨ [MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}:${conn.connection.port}`);
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
    console.error(`👉 Ensure your local MongoDB service is running (e.g. net start MongoDB).`);
    process.exit(1);
  }

  // Connection lifecycle listeners
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [MongoDB] Disconnected from database.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 [MongoDB] Reconnected to database.');
  });
};

module.exports = connectDB;
