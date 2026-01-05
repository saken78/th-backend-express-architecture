/**
 * Validation Middleware
 */

const { body, validationResult } = require("express-validator");

// Validation rules for job creation
const jobValidationRules = () => {
  return [
    body("title")
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage("Title must be between 3 and 255 characters"),

    body("description")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters"),

    body("budget").isFloat({ min: 1 }).withMessage("Budget must be a positive number"),

    body("category_id")
      .optional({ nullable: true, checkFalsy: true }) // PERUBAHAN: allow nullable
      .custom((value) => {
        // Allow null, empty string, or positive integer
        if (value === null || value === "" || value === undefined) {
          return true;
        }
        return Number.isInteger(Number(value)) && Number(value) >= 1;
      })
      .withMessage("Category ID must be null or a positive integer"),

    body("deadline")
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage("Deadline must be a valid date in ISO format"),

    body("location")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 255 })
      .withMessage("Location must not exceed 255 characters"),
  ];
};

// Validation rules for job updates
const jobUpdateValidationRules = () => {
  return [
    body("title")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage("Title must be between 3 and 255 characters"),

    body("description")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters"),

    body("budget")
      .optional({ checkFalsy: true })
      .isFloat({ min: 1 })
      .withMessage("Budget must be a positive number"),

    body("category_id")
      .optional({ nullable: true, checkFalsy: true }) // PERUBAHAN: allow nullable
      .custom((value) => {
        // Allow null, empty string, or positive integer
        if (value === null || value === "" || value === undefined) {
          return true;
        }
        return Number.isInteger(Number(value)) && Number(value) >= 1;
      })
      .withMessage("Category ID must be null or a positive integer"),

    body("status")
      .optional({ checkFalsy: true })
      .isIn(["open", "in_progress", "completed", "cancelled"])
      .withMessage("Status must be one of: open, in_progress, completed, cancelled"),

    body("deadline")
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage("Deadline must be a valid date in ISO format"),

    body("location")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 255 })
      .withMessage("Location must not exceed 255 characters"),
  ];
};

// Validation rules for job applications
const applicationValidationRules = () => {
  return [
    body("proposal")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Proposal must be between 10 and 1000 characters"),

    body("proposed_budget")
      .optional({ checkFalsy: true })
      .custom((value) => {
        if (value === undefined || value === null || value === "") {
          return true;
        }
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error("Proposed budget must be a valid number");
        }
        if (num < 1) {
          throw new Error("Proposed budget must be a positive number");
        }
        return true;
      }),
  ];
};

// Generic validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  jobValidationRules,
  jobUpdateValidationRules,
  applicationValidationRules,
  handleValidationErrors,
};
