const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Challenge = require('../models/challenge.model');
const Ride = require('../models/ride.model');
const SensorData = require('../models/sensorData.model');
const admin = require('firebase-admin');
const OTPManager = require('../utils/otp');
const logger = require('../utils/logger');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    logger.error('Firebase initialization error:', error);
  }
}



const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.NODE_ENV === 'production' ? '12h' : '24h' }
  );
};


// Authentication Handlers
const register = async (req, res) => {
  try {
    const { phoneNumber, password, firstName, lastName, email } = req.body;

    if (!phoneNumber || !password || !firstName || !lastName || !email) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User with this phone number already exists' });
    }

    // Remove the manual password hashing
    const user = new User({ 
      phoneNumber, 
      password,  // Pass the plain password
      firstName, 
      lastName, 
      email, 
      userType: 'rider', 
      safetyScore: 100 
    });
    await user.save();

    const otp = OTPManager.generateOTP();
    console.log(`Complete OTP for ${phoneNumber}: ${otp}`); // Add explicit OTP logging
    await OTPManager.sendOTP(phoneNumber, otp);
    OTPManager.storeOTP(phoneNumber, otp);

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ status: 'success', data: { user: userResponse, token } });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Error registering user' });
  }
};

const login = async (req, res) => {
try {
const { phoneNumber, password } = req.body;
logger.info(`Login attempt for phone: ${phoneNumber}`);
if (!phoneNumber || !password) {
return res.status(400).json({ status: 'error', message: 'Phone number and password are required' });
}

const user = await User.findOne({ phoneNumber });
logger.info(`User found: ${user ? 'Yes' : 'No'}`);
if (!user) {
return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
}

const isValidPassword = await bcrypt.compare(password, user.password);
logger.info(`Password valid: ${isValidPassword}`);
if (!isValidPassword) {
return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
}

const token = generateToken(user._id);
const userResponse = user.toObject();
delete userResponse.password;
logger.info(`Login successful for user: ${user._id}`);
// res.status(200).json({ status: 'success', data: { user: userResponse, token } });


res.status(200).json({ status: 'success', data: { user: userResponse, token } });
} catch (error) {
logger.error('Login error:', error);
res.status(500).json({ status: 'error', message: 'Error logging in' });
}
};

const verifyPhone = async (req, res) => {
try {
const userId = req.user.id;
const { otp } = req.body;

const user = await User.findById(userId);
if (!user) {
return res.status(404).json({ status: 'error', message: 'User not found' });
}

const isValidOTP = OTPManager.verifyOTP(user.phoneNumber, otp);
if (!isValidOTP) {
return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
}

user.isPhoneVerified = true;
await user.save();
logger.info(`Phone verification successful for user: ${userId}`);
res.status(200).json({ status: 'success', message: 'Phone number verified successfully' });


res.status(200).json({ status: 'success', message: 'Phone number verified successfully' });
} catch (error) {
logger.error('Phone verification error:', error);
res.status(500).json({ status: 'error', message: 'Error verifying phone number' });
}
};


const resendPhoneOTP = async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      if (!user) {
          return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      const otp = OTPManager.generateOTP();
      await OTPManager.sendOTP(user.phoneNumber, otp);
      console.log('==========================================');
      console.log(`NEW OTP GENERATED for ${user.phoneNumber}`);
      console.log(`OTP: ${otp}`);
      console.log('==========================================');
      OTPManager.storeOTP(user.phoneNumber, otp);

      res.json({ status: 'success', message: 'OTP sent successfully' });
  } catch (error) {
      console.error('OTP resend error:', error);
      res.status(500).json({ status: 'error', message: 'Error sending OTP' });
  }
};

const getProfile = async (req, res) => {
  try {
    // Debug log to verify user details from middleware
    console.log('Controller - User ID from req.user:', req.user);
    console.log('Inside getProfile Controller');
    console.log('Decoded User:', req.user);


    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    logger.info(`Profile fetched successfully for user: ${req.user.id}`);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ status: 'error', message: 'Error fetching profile' });
  }
};


const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming req.user contains the authenticated user's ID
    console.log('Controller - User ID from req.user:', req.user);

    const updates = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId }, // Find the user by ID
      updates, // Apply the updates
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    res.status(200).json({
      
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({
        status: "error",
        message: "The email address is already in use.",
      });
    }

    console.error("Error updating profile:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating profile.",
    });
  }
};


const addEmergencyContact = async (req, res) => {
try {
const { name, relationship, phoneNumber } = req.body;

if (!name || !relationship || !phoneNumber) {
return res.status(400).json({ status: 'error', message: 'Name, relationship, and phone number are required' });
}

const user = await User.findById(req.user.id);
if (!user) {
return res.status(404).json({ status: 'error', message: 'User not found' });
}

const newContact = { name, relationship, phoneNumber, isVerified: false };
user.emergencyContacts.push(newContact);
await user.save();

logger.info(`Emergency contact added successfully for user: ${req.user.id}`);
res.status(200).json({ status: 'success', message: 'Emergency contact added successfully', data: { contact: newContact } });
} catch (error) {
logger.error('Error adding emergency contact:', error);
res.status(500).json({ status: 'error', message: 'Error adding emergency contact' });
}
};

const createChallenge = async (req, res) => {
try {
const { title, description, reward } = req.body;

if (!title || !description || !reward) {
return res.status(400).json({ status: 'error', message: 'All fields are required' });
}

const challenge = new Challenge({ title, description, reward, createdBy: req.user.id });
await challenge.save();

res.status(201).json({ status: 'success', message: 'Challenge created successfully', data: { challenge } });
} catch (error) {
logger.error('Error creating challenge:', error);
res.status(500).json({ status: 'error', message: 'Error creating challenge' });
}
};

const getChallenges = async (req, res) => {
try {
const challenges = await Challenge.find();
res.status(200).json({ status: 'success', data: { challenges } });
} catch (error) {
logger.error('Error fetching challenges:', error);
res.status(500).json({ status: 'error', message: 'Error fetching challenges' });
}
};

const joinChallenge = async (req, res) => {
try {
const { id } = req.params;
const challenge = await Challenge.findById(id);

if (!challenge) {
return res.status(404).json({ status: 'error', message: 'Challenge not found' });
}

challenge.participants.push(req.user.id);
await challenge.save();

res.status(200).json({ status: 'success', message: 'Successfully joined the challenge', data: { challenge } });
} catch (error) {
logger.error('Error joining challenge:', error);
res.status(500).json({ status: 'error', message: 'Error joining challenge' });
}
};



const startRide = async (req, res) => {
  try {
    const { startTime, startLocation } = req.body;

    if (!startTime || !startLocation) {
      return res.status(400).json({ status: 'error', message: 'Start time and location are required' });
    }

    const ride = new Ride({
      userId: req.user.id,
      startTime,
      startLocation,
    });

    await ride.save();

    res.status(201).json({ status: 'success', message: 'Ride started successfully', data: { ride } });
  } catch (error) {
    logger.error('Error starting ride:', error);
    res.status(500).json({ status: 'error', message: 'Error starting ride' });
  }
};

const pauseRide = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ status: 'error', message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to pause this ride' });
    }

    ride.status = 'paused';
    await ride.save();

    res.status(200).json({ status: 'success', message: 'Ride paused successfully', data: { ride } });
  } catch (error) {
    logger.error('Error pausing ride:', error);
    res.status(500).json({ status: 'error', message: 'Error pausing ride' });
  }
};

const resumeRide = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ status: 'error', message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to resume this ride' });
    }

    ride.status = 'active';
    await ride.save();

    res.status(200).json({ status: 'success', message: 'Ride resumed successfully', data: { ride } });
  } catch (error) {
    logger.error('Error resuming ride:', error);
    res.status(500).json({ status: 'error', message: 'Error resuming ride' });
  }
};

const completeRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { endTime, endLocation } = req.body;

    if (!endTime || !endLocation) {
      return res.status(400).json({ status: 'error', message: 'End time and location are required' });
    }

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ status: 'error', message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to complete this ride' });
    }

    ride.endTime = endTime;
    ride.endLocation = endLocation;
    ride.status = 'completed';
    await ride.save();

    res.status(200).json({ status: 'success', message: 'Ride completed successfully', data: { ride } });
  } catch (error) {
    logger.error('Error completing ride:', error);
    res.status(500).json({ status: 'error', message: 'Error completing ride' });
  }
};

const addSensorData = async (req, res) => {
  try {
    const { id } = req.params;
    const { sensorType, value, timestamp } = req.body;

    if (!sensorType || !value || !timestamp) {
      return res.status(400).json({ status: 'error', message: 'Sensor type, value, and timestamp are required' });
    }

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ status: 'error', message: 'Ride not found' });
    }

    const sensorData = new SensorData({
      rideId: id,
      sensorType,
      value,
      timestamp,
    });

    await sensorData.save();

    res.status(201).json({ status: 'success', message: 'Sensor data added successfully', data: { sensorData } });
  } catch (error) {
    logger.error('Error adding sensor data:', error);
    res.status(500).json({ status: 'error', message: 'Error adding sensor data' });
  }
};

const getRideSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id).populate('sensorData');

    if (!ride) {
      return res.status(404).json({ status: 'error', message: 'Ride not found' });
    }

    res.status(200).json({ status: 'success', data: { ride } });
  } catch (error) {
    logger.error('Error fetching ride summary:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching ride summary' });
  }
};


const createAdmin = async (req, res) => {
  try {
      const superAdmin = await User.findById(req.user.id);
      if (superAdmin.userType !== 'super_admin') {
          return res.status(403).json({ status: 'error', message: 'Only super admin can create admins' });
      }

      const { email, password, phoneNumber, firstName, lastName } = req.body;
      const admin = new User({
          email, password, phoneNumber, firstName, lastName,
          userType: 'admin'
      });
      await admin.save();

      superAdmin.adminCreated.push(admin._id);
      await superAdmin.save();

      res.status(201).json({ status: 'success', data: { admin } });
  } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
  }
};

const listAdmins = async (req, res) => {
  try {
      const superAdmin = await User.findById(req.user.id);
      if (superAdmin.userType !== 'super_admin') {
          return res.status(403).json({ status: 'error', message: 'Access denied' });
      }

      const admins = await User.find({ userType: 'admin' });
      res.json({ status: 'success', data: { admins } });
  } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
  }
};

const removeAdmin = async (req, res) => {
  try {
      const superAdmin = await User.findById(req.user.id);
      if (superAdmin.userType !== 'super_admin') {
          return res.status(403).json({ status: 'error', message: 'Only super admin can remove admins' });
      }

      await User.findByIdAndUpdate(req.params.adminId, { userType: 'rider' });
      superAdmin.adminCreated = superAdmin.adminCreated.filter(id => id.toString() !== req.params.adminId);
      await superAdmin.save();

      res.json({ status: 'success', message: 'Admin removed successfully' });
  } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyPhone,
  resendPhoneOTP,
  getProfile,
  updateProfile,
  addEmergencyContact,
  createChallenge,
  getChallenges,
  joinChallenge,
  startRide,
  pauseRide,
  resumeRide,
  completeRide,
  addSensorData,
  getRideSummary,
};
