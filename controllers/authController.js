/**
 * Auth Controller with HttpOnly Cookie + CSRF Protection
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  generateCSRFToken,
  storeCSRFToken,
  removeCSRFToken,
  getCSRFToken,
} = require("../middlewares/csrfMiddleware");

/**
 * Cookie configuration
 */
const getCookieConfig = () => ({
  httpOnly: true, // JavaScript cannot access
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection
  maxAge: 60 * 60 * 1000, // 1 hour
  path: "/", // Available for all routes
});

/**
 * Register new user
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, repeatPassword, role } = req.body;

    // Validation
    if (!name || !email || !password || !repeatPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== repeatPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Validate role if provided
    if (role && !["poster", "tasker"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'poster' or 'tasker'",
      });
    }

    // Check existing user
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password dengan bcrypt (proper hashing!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await User.create(name, email, hashedPassword);

    // If role is provided, update user's role
    if (role) {
      await User.updateRole(result.insertId, { role });
    }

    // Ensure user has a wallet after registration
    await User.ensureWalletExists(result.insertId);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/**
 * Login user and set httpOnly cookie
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password dengan bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      },
    );

    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    storeCSRFToken(user.id, csrfToken);

    // Set httpOnly cookie
    res.cookie("auth_token", token, getCookieConfig());

    // Return user data + CSRF token (BUKAN JWT token!)
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
      },
      csrfToken, // Frontend need this for subsequent requests
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * Logout user and clear cookie
 * Uses optionalAuth - works even if token expired
 */
exports.logout = async (req, res) => {
  try {
    // Clear CSRF token if user is authenticated
    if (req.userId) {
      removeCSRFToken(req.userId);
    }

    // Clear the cookie (without maxAge to avoid deprecation warning)
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, still return success for logout
    // since the primary goal is to clear the cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });
    res.json({
      success: true,
      message: "Logout successful (cookie cleared)",
    });
  }
};

/**
 * Get CSRF token endpoint
 * Untuk refresh CSRF token jika needed
 */
exports.getCSRFToken = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get or generate new CSRF token
    let csrfToken = getCSRFToken(userId);

    if (!csrfToken) {
      csrfToken = generateCSRFToken();
      storeCSRFToken(userId, csrfToken);
    }

    res.json({
      success: true,
      csrfToken,
    });
  } catch (error) {
    console.error("Get CSRF token error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

/**
 * Get current user info
 */
exports.me = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: "If that email exists, a password reset link will be sent",
      });
    }

    // Generate reset token
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token in users table
    const pool = require("../config/database");
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
        [resetTokenHash, resetTokenExpiry, user.id],
      );
    } finally {
      connection.release();
    }

    // TODO: Send email with reset link
    // For now, return token in response (for development only)
    console.log(
      `Password reset link: http://localhost:3000/reset-password/${resetToken}`,
    );

    res.json({
      success: true,
      message: "If that email exists, a password reset link will be sent",
      // Remove in production - only for development
      resetLink:
        process.env.NODE_ENV === "development"
          ? `http://localhost:3000/reset-password/${resetToken}`
          : undefined,
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
      error: error.message,
    });
  }
};

/**
 * Verify reset token
 * GET /api/auth/verify-reset-token/:token
 */
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    const crypto = require("crypto");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const pool = require("../config/database");
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()`,
        [resetTokenHash],
      );

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Reset token is invalid or has expired",
        });
      }

      res.json({
        success: true,
        message: "Reset token is valid",
        email: rows[0].email,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("verifyResetToken error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify reset token",
      error: error.message,
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const crypto = require("crypto");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const pool = require("../config/database");
    const connection = await pool.getConnection();
    try {
      // Find user with valid reset token
      const [rows] = await connection.execute(
        `SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()`,
        [resetTokenHash],
      );

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Reset token is invalid or has expired",
        });
      }

      const userId = rows[0].id;

      // Hash new password
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await connection.execute(
        `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
        [hashedPassword, userId],
      );

      res.json({
        success: true,
        message: "Password has been reset successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};
