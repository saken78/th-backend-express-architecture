/**
 * Auth Middleware untuk verify JWT dari httpOnly cookie
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware untuk verify JWT token dari cookie
 */
async function verifyToken(req, res, next) {
  try {
    // Get token dari cookie (bukan Authorization header!)
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user object to include role and other details
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user info ke request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.user = user; // Include full user object with role

    next();
  } catch (error) {
    // Token invalid atau expired
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: error.message,
    });
  }
}

/**
 * Optional middleware - hanya attach user jika ada token
 * Tidak throw error jika tidak ada
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.auth_token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch full user object to include role and other details
      const user = await User.findById(decoded.userId);

      if (user) {
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.user = user; // Include full user object with role
      }
    }

    next();
  } catch (error) {
    // Ignore errors, just continue
    next();
  }
}

module.exports = {
  verifyToken,
  optionalAuth,
};
