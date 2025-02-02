const express = require('express');
const { auth } = require('../middleware/auth');
const {
  addEmergencyContact,
  verifyEmergencyContact,
  listEmergencyContacts,
  deleteEmergencyContact,
  resendOTP, // Include resendOTP
} = require('../controllers/emergency-contact.controller');

const router = express.Router();

router.use(auth);

router.post('/', addEmergencyContact);
router.post('/verify', verifyEmergencyContact);
router.get('/', listEmergencyContacts);
router.delete('/:contactId', deleteEmergencyContact);
router.post('/resend-otp', resendOTP); // Define the resend-otp route

module.exports = router;
