const User = require('../models/user.model');
const logger = require('./logger');

const initializeSuperAdmin = async () => {
   try {
       // First remove if exists
       await User.deleteOne({ phoneNumber: '+917708484950' });
       
       // Create new super admin
       const superAdmin = await User.create({
           email: 'super@admin.com',
           password: 'Superadmin@9020',
           phoneNumber: '+917708484950',
           firstName: "Super",
           lastName: "Admin",
           userType: "super_admin",
           isPhoneVerified: true,
           isEmailVerified: true,
           safetyScore: 100
       });
       logger.info('Super admin initialized:', superAdmin.email);
   } catch (error) {
       logger.error('Super admin initialization failed:', error);
   }
};

module.exports = initializeSuperAdmin;