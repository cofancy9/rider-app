const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/user.model');
const connectDB = require('./config/database');
const initializeSuperAdmin = require('./utils/initializeSuperAdmin');

// Import routes
const authRoutes = require('./routes/auth.routes');
const emergencyContactRoutes = require('./routes/emergency-contact.routes');
const challengeRoutes = require('./routes/challenge.routes');
const documentRoutes = require('./routes/document.routes');
const rideRoutes = require('./routes/ride.routes');
const ridePatternRoutes = require('./routes/ridePattern.routes');
const sensorRoutes = require('./routes/sensor.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect Database
connectDB()
   .then(() => {
       console.log('MongoDB Connected');
       return initializeSuperAdmin();
   })
   .then(() => {
       console.log('Super Admin Initialized');
   })
   .catch(err => {
       console.error('Database connection error:', err);
       process.exit(1);
   });

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/ride-patterns', ridePatternRoutes);
app.use('/api/sensor', sensorRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
   res.status(200).json({
       status: 'healthy',
       mongo: mongoose.connection.readyState === 1,
       time: new Date().toISOString()
   });
});

// Debug route
app.get('/debug/users', async (req, res) => {
   try {
       const users = await User.find({}).select('phoneNumber userType');
       res.json(users);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
});

// Error handler
app.use((err, req, res, next) => {
   console.error('Unhandled error:', err);
   res.status(500).json({
       status: 'error',
       message: process.env.NODE_ENV === 'production' ? 
           'Internal server error' : 
           err.message
   });
});

// Start server
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => {
   console.log(`Server running on port ${port}`);
});

module.exports = app;