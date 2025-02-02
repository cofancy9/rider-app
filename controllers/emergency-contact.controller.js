const User = require('../models/user.model');
const OTPManager = require('../utils/otp');
const logger = require('../utils/logger');

const addEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, relationship, phoneNumber } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const existingContact = user.emergencyContacts.find(
      contact => contact.phoneNumber === phoneNumber
    );

    if (existingContact) {
      return res.status(400).json({
        status: 'error',
        message: 'This phone number is already registered as an emergency contact'
      });
    }

    const otp = OTPManager.generateOTP();
    await OTPManager.sendOTP(phoneNumber, otp);
    OTPManager.storeOTP(phoneNumber, otp);

    user.emergencyContacts.push({
      name,
      relationship,
      phoneNumber,
      isVerified: false
    });

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Emergency contact added. OTP sent for verification.',
      data: {
        contact: user.emergencyContacts[user.emergencyContacts.length - 1]
      }
    });
  } catch (error) {
    logger.error('Error adding emergency contact:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding emergency contact'
    });
  }
};

const verifyEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const contactIndex = user.emergencyContacts.findIndex(
      contact => contact.phoneNumber === phoneNumber
    );

    if (contactIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Emergency contact not found'
      });
    }

    const isValidOTP = OTPManager.verifyOTP(phoneNumber, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    user.emergencyContacts[contactIndex].isVerified = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Emergency contact verified successfully',
      data: {
        contact: user.emergencyContacts[contactIndex]
      }
    });
  } catch (error) {
    logger.error('Error verifying emergency contact:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying emergency contact'
    });
  }
};

const listEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        contacts: user.emergencyContacts
      }
    });
  } catch (error) {
    logger.error('Error listing emergency contacts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving emergency contacts'
    });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const contactIndex = user.emergencyContacts.findIndex(
      contact => contact._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Emergency contact not found'
      });
    }

    user.emergencyContacts.splice(contactIndex, 1);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting emergency contact:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting emergency contact'
    });
  }
};

module.exports = {
  addEmergencyContact,
  verifyEmergencyContact,
  listEmergencyContacts,
  deleteEmergencyContact
};

const resendOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                status: 'error',
                message: 'Phone number is required',
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        const contact = user.emergencyContacts.find(
            (contact) => contact.phoneNumber === phoneNumber
        );

        if (!contact) {
            return res.status(404).json({
                status: 'error',
                message: 'Emergency contact not found',
            });
        }

        // Generate and resend OTP
        const otp = OTPManager.generateOTP();
        await OTPManager.sendOTP(phoneNumber, otp);
        OTPManager.storeOTP(phoneNumber, otp);

        res.status(200).json({
            status: 'success',
            message: 'OTP resent successfully',
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error resending OTP',
        });
    }
};

module.exports = {
  addEmergencyContact,
  verifyEmergencyContact,
  listEmergencyContacts,
  deleteEmergencyContact,
  resendOTP, // Add resendOTP to the exports
};

