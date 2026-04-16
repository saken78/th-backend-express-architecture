const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const {
  jobValidationRules,
  jobUpdateValidationRules,
  handleValidationErrors,
} = require("../middlewares/validationMiddleware");

const jobController = require("../controllers/JobController");

// POST /api/jobs - Create new job (Poster only)
router.post(
  "/",
  verifyToken,
  checkRole("poster"),
  jobValidationRules(),
  handleValidationErrors,
  jobController.createJob,
);

// SPECIFIC ROUTES MUST BE BEFORE GENERIC /:id ROUTE

// GET /api/jobs/my-jobs - Get jobs posted by current user (Poster only)
// MUST be before /:id route to avoid matching as /jobs/id
router.get(
  "/my-jobs",
  verifyToken,
  checkRole("poster"),
  jobController.getMyJobs,
);

// GET /api/jobs/saved - Get saved/bookmarked jobs for current user (All users)
// MUST be before /:id route to avoid matching as /jobs/id
router.get("/saved", verifyToken, jobController.getSavedJobs);

// POST /api/jobs/:id/save - Save a job to bookmarks (All users)
// MUST be before generic PUT/DELETE /:id routes
router.post("/:id/save", verifyToken, jobController.saveJob);

// DELETE /api/jobs/:id/save - Remove a job from bookmarks (All users)
// MUST be before generic PUT/DELETE /:id routes
router.delete("/:id/save", verifyToken, jobController.unsaveJob);

// PUT /api/jobs/:id/complete - Complete job and process payment (Poster only)
// MUST be before generic PUT /:id route
router.put(
  "/:id/complete",
  verifyToken,
  checkRole("poster"),
  jobController.completeJob,
);

// PUT /api/jobs/:id/submit-work - Submit work (Tasker only)
// Tasker marks job as completed and ready for payment
router.put(
  "/:id/submit-work",
  verifyToken,
  checkRole("tasker"),
  jobController.submitWork,
);

// GET /api/jobs/completed - Get completed jobs for current user (All users)
// MUST be before generic /:id route to avoid matching as /jobs/id
router.get("/completed", verifyToken, jobController.getCompletedJobsForUser);

// GENERIC ROUTES AFTER ALL SPECIFIC ROUTES

// GET /api/jobs - List jobs with filters (All users)
router.get("/", jobController.getAllJobs);

// PUT /api/jobs/:id - Update job (Poster only)
router.put(
  "/:id",
  verifyToken,
  checkRole("poster"),
  jobUpdateValidationRules(),
  handleValidationErrors,
  jobController.updateJob,
);

// DELETE /api/jobs/:id - Delete job (Poster only)
router.delete(
  "/:id",
  verifyToken,
  checkRole("poster"),
  jobController.deleteJob,
);

// GET /api/jobs/:id - Get job details (All users)
// MUST be LAST to avoid matching other routes
router.get("/:id", jobController.getJobById);

module.exports = router;

