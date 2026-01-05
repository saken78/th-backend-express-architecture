/**
 * CSRF Middleware untuk httpOnly Cookie Authentication
 *
 * Flow:
 * 1. Generate CSRF token saat login
 * 2. Store di session/memory (linked dengan user session)
 * 3. Return ke frontend di response body
 * 4. Frontend send di header X-CSRF-Token
 * 5. Validate setiap non-GET request
 */

const crypto = require('crypto');

// In-memory store untuk CSRF tokens
// Production: gunakan Redis atau database
const csrfTokens = new Map();

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store CSRF token untuk user
 */
function storeCSRFToken(userId, token) {
  csrfTokens.set(userId.toString(), token);
}

/**
 * Get CSRF token untuk user
 */
function getCSRFToken(userId) {
  return csrfTokens.get(userId.toString());
}

/**
 * Remove CSRF token (saat logout)
 */
function removeCSRFToken(userId) {
  csrfTokens.delete(userId.toString());
}

/**
 * Middleware untuk validate CSRF token
 * Skip untuk GET requests
 */
function validateCSRF(req, res, next) {
  // Skip CSRF validation untuk GET requests
  if (req.method === 'GET') {
    return next();
  }

  // Get CSRF token dari header
  const csrfToken = req.headers['x-csrf-token'];

  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required',
    });
  }

  // Get user ID dari JWT token yang sudah di-decode oleh auth middleware
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for CSRF validation',
    });
  }

  // Validate CSRF token
  const storedToken = getCSRFToken(userId);

  if (csrfToken !== storedToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }

  next();
}

module.exports = {
  generateCSRFToken,
  storeCSRFToken,
  getCSRFToken,
  removeCSRFToken,
  validateCSRF,
};
