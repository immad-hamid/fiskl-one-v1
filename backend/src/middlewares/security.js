const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../utils/logger');

// XSS Protection middleware
const xssProtection = (req, res, next) => {
  // Recursively sanitize all string values in request body
  function sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return xss(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  }

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Request validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.security('Input validation failed', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// Common validation rules
const validationRules = {
  // Invoice validation
  invoiceCreate: [
    body('invoiceType')
      .notEmpty()
      .withMessage('Invoice type is required')
      .isIn(['Sale Invoice', 'Debit Note', 'Credit Note'])
      .withMessage('Invalid invoice type'),

    body('invoiceDate')
      .isISO8601()
      .withMessage('Invalid invoice date format'),

    body('sellerNTNCNIC')
      .notEmpty()
      .withMessage('Seller NTN/CNIC is required')
      .isLength({ min: 8, max: 20 })
      .withMessage('Seller NTN/CNIC must be between 8-20 characters')
      .matches(/^[0-9-]+$/)
      .withMessage('Seller NTN/CNIC must contain only numbers and dashes'),

    body('sellerBusinessName')
      .notEmpty()
      .withMessage('Seller business name is required')
      .isLength({ max: 200 })
      .withMessage('Seller business name too long'),

    body('sellerProvince')
      .notEmpty()
      .withMessage('Seller province is required'),

    body('sellerAddress')
      .notEmpty()
      .withMessage('Seller address is required')
      .isLength({ max: 500 })
      .withMessage('Seller address too long'),

    body('buyerNTNCNIC')
      .notEmpty()
      .withMessage('Buyer NTN/CNIC is required')
      .isLength({ min: 8, max: 20 })
      .withMessage('Buyer NTN/CNIC must be between 8-20 characters')
      .matches(/^[0-9-]+$/)
      .withMessage('Buyer NTN/CNIC must contain only numbers and dashes'),

    body('buyerBusinessName')
      .notEmpty()
      .withMessage('Buyer business name is required')
      .isLength({ max: 200 })
      .withMessage('Buyer business name too long'),

    body('buyerProvince')
      .notEmpty()
      .withMessage('Buyer province is required'),

    body('buyerAddress')
      .notEmpty()
      .withMessage('Buyer address is required')
      .isLength({ max: 500 })
      .withMessage('Buyer address too long'),

    body('buyerRegistrationType')
      .notEmpty()
      .withMessage('Buyer registration type is required'),

    body('scenarioId')
      .notEmpty()
      .withMessage('Scenario ID is required')
      .matches(/^SN\d{3}$/)
      .withMessage('Invalid scenario ID format'),

    body('advanceTax236G')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Advance tax 236G must be between 0-100'),

    body('advanceTax236H')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Advance tax 236H must be between 0-100'),

    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),

    body('items.*.hsCode')
      .notEmpty()
      .withMessage('HS Code is required for each item')
      .isLength({ max: 20 })
      .withMessage('HS Code too long'),

    body('items.*.productDescription')
      .notEmpty()
      .withMessage('Product description is required for each item')
      .isLength({ max: 500 })
      .withMessage('Product description too long'),

    body('items.*.quantity')
      .isFloat({ min: 0.001 })
      .withMessage('Quantity must be greater than 0'),

    body('items.*.valueSalesExcludingST')
      .isFloat({ min: 0 })
      .withMessage('Value sales excluding ST must be 0 or greater'),
  ],

  // Invoice ID parameter validation
  invoiceId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid invoice ID')
  ],

  // Profile validation
  profileCreate: [
    body('name')
      .notEmpty()
      .withMessage('Profile name is required')
      .isLength({ max: 100 })
      .withMessage('Profile name too long'),

    body('ntncnic')
      .notEmpty()
      .withMessage('NTN/CNIC is required')
      .isLength({ min: 8, max: 20 })
      .withMessage('NTN/CNIC must be between 8-20 characters')
      .matches(/^[0-9-]+$/)
      .withMessage('NTN/CNIC must contain only numbers and dashes'),

    body('businessName')
      .notEmpty()
      .withMessage('Business name is required')
      .isLength({ max: 200 })
      .withMessage('Business name too long'),

    body('province')
      .notEmpty()
      .withMessage('Province is required'),

    body('address')
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ max: 500 })
      .withMessage('Address too long'),

    body('registrationType')
      .notEmpty()
      .withMessage('Registration type is required'),
  ],

  // Login validation
  login: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1-1000'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1-100'),
  ]
};

// Rate limiting for sensitive endpoints
const sensitiveEndpointLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security('Rate limit exceeded for sensitive endpoint', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

module.exports = {
  xssProtection,
  mongoSanitize: mongoSanitize(),
  handleValidationErrors,
  validationRules,
  sensitiveEndpointLimiter
};