const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'No authentication token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Auth Middleware Error:', error.message);
        res.status(401).json({ 
            status: 'error', 
            message: 'Authentication failed' 
        });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'User not found' 
            });
        }

        if (user.userType !== 'admin') {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Admin access required' 
            });
        }

        next();
    } catch (error) {
        logger.error('Admin Check Error:', error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error checking admin status' 
        });
    }
};

const validateChallenge = async (req, res, next) => {
    try {
        const { type, minDistance, maxDistance } = req.body;
        const ranges = {
            micro: [10, 15],
            mini: [15, 20],
            small: [20, 25],
            long: [25, 30],
            extraLong: [30, Infinity]
        };

        if (!ranges[type]) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid challenge type'
            });
        }

        const [min, max] = ranges[type];
        if (minDistance < min || maxDistance > max) {
            return res.status(400).json({
                status: 'error',
                message: `Distance range for ${type} must be between ${min} and ${max} km`
            });
        }

        next();
    } catch (error) {
        logger.error('Challenge Validation Error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error validating challenge parameters'
        });
    }
};

module.exports = { 
    auth, 
    isAdmin,
    validateChallenge 
};
