const User = require('../models/user.model');
const logger = require('../utils/logger');

const createAdmin = async (req, res) => {
   try {
       const superAdmin = await User.findById(req.user.id);
       if (superAdmin.userType !== 'super_admin') {
           return res.status(403).json({ status: 'error', message: 'Only super admin can create admins' });
       }

       const { email, password, phoneNumber, firstName, lastName } = req.body;
       const admin = new User({
           email,
           password,
           phoneNumber,
           firstName,
           lastName,
           userType: 'admin',
           isPhoneVerified: true,
           isEmailVerified: true
       });
       await admin.save();

       superAdmin.adminCreated.push(admin._id);
       await superAdmin.save();

       const adminResponse = admin.toObject();
       delete adminResponse.password;

       res.status(201).json({
           status: 'success',
           data: { admin: adminResponse }
       });
   } catch (error) {
       logger.error('Admin creation error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message
       });
   }
};

const listAdmins = async (req, res) => {
   try {
       const superAdmin = await User.findById(req.user.id);
       if (superAdmin.userType !== 'super_admin') {
           return res.status(403).json({
               status: 'error',
               message: 'Only super admin can list admins'
           });
       }

       const admins = await User.find({ userType: 'admin' })
           .select('-password')
           .sort({ createdAt: -1 });

       res.json({
           status: 'success',
           data: { admins }
       });
   } catch (error) {
       logger.error('List admins error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message
       });
   }
};

const getAdmin = async (req, res) => {
   try {
       const superAdmin = await User.findById(req.user.id);
       if (superAdmin.userType !== 'super_admin') {
           return res.status(403).json({
               status: 'error',
               message: 'Only super admin can view admin details'
           });
       }

       const admin = await User.findById(req.params.adminId).select('-password');
       if (!admin || admin.userType !== 'admin') {
           return res.status(404).json({
               status: 'error',
               message: 'Admin not found'
           });
       }

       res.json({
           status: 'success',
           data: { admin }
       });
   } catch (error) {
       logger.error('Get admin error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message
       });
   }
};

const updateAdmin = async (req, res) => {
   try {
       const superAdmin = await User.findById(req.user.id);
       if (superAdmin.userType !== 'super_admin') {
           return res.status(403).json({
               status: 'error',
               message: 'Only super admin can update admins'
           });
       }

       const { email, firstName, lastName, phoneNumber } = req.body;
       const admin = await User.findByIdAndUpdate(
           req.params.adminId,
           { email, firstName, lastName, phoneNumber },
           { new: true }
       ).select('-password');

       if (!admin || admin.userType !== 'admin') {
           return res.status(404).json({
               status: 'error',
               message: 'Admin not found'
           });
       }

       res.json({
           status: 'success',
           data: { admin }
       });
   } catch (error) {
       logger.error('Update admin error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message
       });
   }
};

const removeAdmin = async (req, res) => {
   try {
       const superAdmin = await User.findById(req.user.id);
       if (superAdmin.userType !== 'super_admin') {
           return res.status(403).json({
               status: 'error',
               message: 'Only super admin can remove admins'
           });
       }

       const admin = await User.findByIdAndUpdate(
           req.params.adminId,
           { userType: 'rider' },
           { new: true }
       );

       if (!admin) {
           return res.status(404).json({
               status: 'error',
               message: 'Admin not found'
           });
       }

       superAdmin.adminCreated = superAdmin.adminCreated.filter(
           id => id.toString() !== req.params.adminId
       );
       await superAdmin.save();

       res.json({
           status: 'success',
           message: 'Admin removed successfully'
       });
   } catch (error) {
       logger.error('Remove admin error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message
       });
   }
};

const deleteUser = async (req, res) => {
    try {
        const requestingUser = await User.findById(req.user.id);
        if (requestingUser.userType !== 'super_admin' && requestingUser.userType !== 'admin') {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Only admin or super admin can delete users' 
            });
        }

        const userToDelete = await User.findById(req.params.userId);
        if (!userToDelete) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Prevent deletion of super_admin
        if (userToDelete.userType === 'super_admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Super admin cannot be deleted'
            });
        }

        // Admin can only delete riders
        if (requestingUser.userType === 'admin' && userToDelete.userType !== 'rider') {
            return res.status(403).json({
                status: 'error',
                message: 'Admin can only delete riders'
            });
        }

        await userToDelete.remove();

        res.json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


module.exports = {
   createAdmin,
   listAdmins,
   getAdmin,
   updateAdmin,
   removeAdmin,
   deleteUser
};