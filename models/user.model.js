const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emergencyContactSchema = new mongoose.Schema({
   name: {
       type: String,
       required: true,
       trim: true
   },
   relationship: {
       type: String,
       required: true,
       trim: true
   },
   phoneNumber: {
       type: String,
       required: true,
       trim: true
   },
   isVerified: {
       type: Boolean,
       default: false
   }
});

const documentSchema = new mongoose.Schema({
   type: {
       type: String,
       required: true,
       enum: ['license', 'insurance', 'registration', 'other']
   },
   documentId: {
       type: String,
       required: true
   },
   verificationStatus: {
       type: String,
       enum: ['pending', 'verified', 'rejected'],
       default: 'pending'
   },
   uploadDate: {
       type: Date,
       default: Date.now
   }
});

const userSchema = new mongoose.Schema({
   firstName: {
       type: String,
       required: true,
       trim: true
   },
   lastName: {
       type: String,
       required: true,
       trim: true
   },
   phoneNumber: {
       type: String,
       required: true,
       unique: true,
       trim: true
   },
   email: {
       type: String,
       required: true,
       unique: true,
       trim: true,
       lowercase: true
   },
   password: {
       type: String,
       required: true,
       minlength: 8
   },
   userType: {
       type: String,
       enum: ['rider', 'admin', 'super_admin'],
       required: true
   },
   isPhoneVerified: {
       type: Boolean,
       default: false
   },
   isEmailVerified: {
       type: Boolean,
       default: false
   },
   documents: [documentSchema],
   emergencyContacts: [emergencyContactSchema],
   safetyScore: {
       type: Number,
       default: 100,
       min: 0,
       max: 100
   },
   adminCreated: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       default: []
   }]
}, {
   timestamps: true
});

userSchema.pre('save', async function(next) {
   if (this.isModified('password')) {
       this.password = await bcrypt.hash(this.password, 10);
       console.log("Hashed password:", this.password); // Add logging to verify the hashed password
   }
   next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
   return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;