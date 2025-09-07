const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

const validateProfile = (req, res, next) => {
  const { name, ntncnic, businessName, province, address, registrationType } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Profile name is required' });
  }

  if (!ntncnic || typeof ntncnic !== 'string' || ntncnic.trim().length === 0) {
    errors.push({ field: 'ntncnic', message: 'NTN/CNIC is required' });
  }

  if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
    errors.push({ field: 'businessName', message: 'Business name is required' });
  }

  if (!province || typeof province !== 'string' || province.trim().length === 0) {
    errors.push({ field: 'province', message: 'Province is required' });
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  if (!registrationType || typeof registrationType !== 'string' || registrationType.trim().length === 0) {
    errors.push({ field: 'registrationType', message: 'Registration type is required' });
  } else if (!['Registered', 'Unregistered'].includes(registrationType)) {
    errors.push({ field: 'registrationType', message: 'Registration type must be either "Registered" or "Unregistered"' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = { validateRequest, validateProfile };