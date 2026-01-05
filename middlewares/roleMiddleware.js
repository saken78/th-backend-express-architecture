/**
 * Role-based access control middleware
 */

// Middleware to check if user has a specific role
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role; // Assuming user object is attached by auth middleware

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: "User role not found. Please ensure you have selected a role.",
      });
    }

    if (userRole !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires '${requiredRole}' role.`,
      });
    }

    next();
  };
};

// Middleware to check if user has any of the allowed roles
const checkRoles = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: "User role not found. Please ensure you have selected a role.",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
};

// Middleware to check if user has selected a role (not null)
const hasRole = (req, res, next) => {
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({
      success: false,
      message: "Please select a role (poster or tasker) before continuing.",
    });
  }

  next();
};

module.exports = {
  checkRole,
  checkRoles,
  hasRole,
};