const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
 try {
   // Connection options
   const options = {
     maxPoolSize: 50,
     minPoolSize: 10, 
     maxIdleTimeMS: 10000,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
     retryWrites: true,
     retryReads: true
   };

   // Debug logging
   logger.info('Attempting MongoDB connection...');
   logger.info(`Database URL: ${process.env.DATABASE_URL?.split('@')[1]}`); // Log URL without credentials

   // Connection event handlers
   mongoose.connection.on('connected', () => logger.info('MongoDB connected successfully'));
   mongoose.connection.on('error', (err) => logger.error('MongoDB connection error:', err));
   mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

   // Handle graceful shutdown
   process.on('SIGINT', async () => {
     await mongoose.connection.close();
     logger.info('MongoDB connection closed due to app termination');
     process.exit(0);
   });

   // Connect with retries
   let retries = 3;
   while (retries > 0) {
     try {
       await mongoose.connect(process.env.DATABASE_URL, options);
       logger.info(`MongoDB Connected to: ${mongoose.connection.host}`);
       break;
     } catch (err) {
       retries--;
       if (retries === 0) throw err;
       logger.warn(`Connection failed, retrying... (${retries} attempts left)`);
       await new Promise(resolve => setTimeout(resolve, 5000));
     }
   }

 } catch (error) {
   logger.error('Fatal MongoDB connection error:', error);
   process.exit(1);
 }
};

module.exports = connectDB;