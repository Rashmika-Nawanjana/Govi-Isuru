const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Find user in database
    let user = await User.findById(decoded.id);
    if (!user) {
      console.log(`User not found for ID: ${decoded.id}, using token data as fallback`);
      // Fallback: Use data from token if user not in DB (handles race conditions during signup)
      req.user = {
        _id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        district: decoded.district,
        dsDivision: decoded.dsDivision,
        gnDivision: decoded.gnDivision,
        phone: decoded.phone, // Include phone from token if available
        email: decoded.email,
        fullName: decoded.username
      };
      return next();
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

module.exports = authMiddleware;
