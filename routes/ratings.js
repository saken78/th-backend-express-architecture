const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

const reviewController = require("../controllers/ReviewController");
const notificationController = require("../controllers/NotificationController");

// ===============================
// REVIEW ENDPOINTS
// ===============================

// POST /api/ratings/reviews - Create a new review (Authenticated users)
router.post(
  "/reviews",
  verifyToken,
  reviewController.createReview
);

// GET /api/ratings/reviews/:id - Get review by ID (Reviewer, Reviewee, or authorized user)
router.get(
  "/reviews/:id",
  verifyToken,
  reviewController.getReviewById
);

// GET /api/ratings/jobs/:jobId/reviews - Get all reviews for a job (Job participants)
router.get(
  "/jobs/:jobId/reviews",
  verifyToken,
  reviewController.getReviewsForJob
);

// GET /api/ratings/users/:userId/reviews - Get all reviews for a user (as reviewee)
router.get(
  "/users/:userId/reviews",
  verifyToken,
  reviewController.getReviewsForUser
);

// GET /api/ratings/users/:userId/rating - Get user's average rating
router.get(
  "/users/:userId/rating",
  verifyToken,
  reviewController.getUserRating
);

// GET /api/ratings/my-reviews - Get reviews created by current user (as reviewer)
router.get(
  "/my-reviews",
  verifyToken,
  reviewController.getReviewsByUser
);

// ===============================
// NOTIFICATION ENDPOINTS
// ===============================

// GET /api/ratings/notifications - Get user's notifications
router.get(
  "/notifications",
  verifyToken,
  notificationController.getUserNotifications
);

// PUT /api/ratings/notifications/:id/read - Mark notification as read
router.put(
  "/notifications/:id/read",
  verifyToken,
  notificationController.markNotificationAsRead
);

// PUT /api/ratings/notifications/mark-all-read - Mark all notifications as read
router.put(
  "/notifications/mark-all-read",
  verifyToken,
  notificationController.markAllNotificationsAsRead
);

// DELETE /api/ratings/notifications/:id - Delete notification
router.delete(
  "/notifications/:id",
  verifyToken,
  notificationController.deleteNotification
);

module.exports = router;