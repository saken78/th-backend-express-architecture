/**
 * Auth Routes dengan HttpOnly Cookie
 */

const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// Protected routes (require authentication)
router.post('/logout', optionalAuth, authController.logout);
router.get('/csrf-token', verifyToken, authController.getCSRFToken);
router.get('/me', verifyToken, authController.me);

module.exports = router;
