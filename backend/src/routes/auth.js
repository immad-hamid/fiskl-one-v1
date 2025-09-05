const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// In-memory session store (in production, use Redis or database)
const sessions = new Map();

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check credentials against .env
    const validEmail = process.env.LOGIN_EMAIL;
    const validPassword = process.env.LOGIN_PASSWORD;

    if (email !== validEmail || password !== validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate random session token
    const sessionToken = crypto.randomUUID();
    
    // Store session (expires in 24 hours)
    sessions.set(sessionToken, {
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        sessionToken,
        user: { email }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionToken) {
      sessions.delete(sessionToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify session endpoint
router.get('/verify', (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }

    const session = sessions.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token'
      });
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      sessions.delete(sessionToken);
      return res.status(401).json({
        success: false,
        message: 'Session has expired'
      });
    }

    res.json({
      success: true,
      message: 'Session is valid',
      data: {
        user: { email: session.email }
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Middleware to verify session for protected routes
const verifySession = (req, res, next) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({
      success: false,
      message: 'No session token provided'
    });
  }

  const session = sessions.get(sessionToken);
  
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Invalid session token'
    });
  }

  // Check if session has expired
  if (new Date() > session.expiresAt) {
    sessions.delete(sessionToken);
    return res.status(401).json({
      success: false,
      message: 'Session has expired'
    });
  }

  // Add user info to request
  req.user = { email: session.email };
  next();
};

module.exports = { router, verifySession };