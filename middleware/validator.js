const Joi = require('joi');

const userRegistrationSchema = Joi.object({
  firstName: Joi.string().required().trim(),
  lastName: Joi.string().required().trim(),
  email: Joi.string().email().required().trim(),
  phoneNumber: Joi.string().required().trim(),
  password: Joi.string().min(8).required(),
  userType: Joi.string().valid('rider', 'admin', 'partner').default('rider')
});

const validateRegistration = (req, res, next) => {
  const { error } = userRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateRegistration
};
