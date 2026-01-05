const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const {
  applicationValidationRules,
  handleValidationErrors,
} = require("../middlewares/validationMiddleware");

const applicationController = require("../controllers/ApplicationController");

// Specific routes first (before parameterized routes)

// POST /api/applications/jobs/:id/apply - Apply to job (Tasker only)
router.post(
  "/jobs/:id/apply",
  verifyToken,
  checkRole("tasker"),
  applicationValidationRules(),
  handleValidationErrors,
  applicationController.applyToJob,
);

// GET /api/applications/my-applications - Get my applications (Tasker only)
router.get(
  "/my-applications",
  verifyToken,
  checkRole("tasker"),
  applicationController.getMyApplications,
);

// GET /api/applications/applications/:id - Get application by ID
router.get(
  "/applications/:id",
  verifyToken,
  applicationController.getApplicationById,
);

// Generic parameterized routes (after specific ones)

// GET /api/applications/jobs/:id/applications - Get applications for a job (Poster only)
router.get(
  "/jobs/:id/applications",
  verifyToken,
  checkRole("poster"),
  applicationController.getApplicationsForJob,
);

// GET /api/applications/:id/applications - Alternative route for debugging
router.get(
  "/:id/applications",
  verifyToken,
  checkRole("poster"),
  applicationController.getApplicationsForJob,
);

// PUT /api/applications/applications/:id/accept - Accept application (Poster only)
router.put(
  "/applications/:id/accept",
  verifyToken,
  checkRole("poster"),
  applicationController.acceptApplication,
);

// PUT /api/applications/applications/:id/reject - Reject application (Poster only)
router.put(
  "/applications/:id/reject",
  verifyToken,
  checkRole("poster"),
  applicationController.rejectApplication,
);

module.exports = router;
