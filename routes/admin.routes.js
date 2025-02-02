const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const { 
    createAdmin, 
    listAdmins, 
    removeAdmin,
    updateAdmin,
    getAdmin,
    deleteUser
} = require('../controllers/admin.controller');

const router = express.Router();

router.post('/create-admin', auth, createAdmin);
router.get('/admins', auth, listAdmins);
router.get('/admins/:adminId', auth, getAdmin);
router.put('/admins/:adminId', auth, updateAdmin);
router.delete('/admins/:adminId', auth, removeAdmin);
router.delete('/users/:userId', auth, deleteUser);

module.exports = router;