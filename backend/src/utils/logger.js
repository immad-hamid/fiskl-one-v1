const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'fiskl-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If not in production, also log to console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper methods for common logging patterns
logger.security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, { ...meta, type: 'security' });
};

logger.api = (method, url, statusCode, responseTime, meta = {}) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level](`${method} ${url} ${statusCode} - ${responseTime}ms`, {
    ...meta,
    type: 'api',
    method,
    url,
    statusCode,
    responseTime
  });
};

logger.database = (operation, table, duration, meta = {}) => {
  logger.info(`DB ${operation} on ${table} - ${duration}ms`, {
    ...meta,
    type: 'database',
    operation,
    table,
    duration
  });
};

module.exports = logger;