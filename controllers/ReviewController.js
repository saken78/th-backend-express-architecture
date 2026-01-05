/**
 * Review Controller
 */

const Review = require("../models/Review");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

// ===============================
// CREATE REVIEW
// ===============================

exports.createReview = async (req, res) => {
  try {
    const { job_id, reviewee_id, rating, comment } = req.body;
    const reviewerId = req.userId;

    // Validate required fields
    if (!job_id || !reviewee_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Job ID, reviewee ID, and rating are required",
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if user has permission to review
    // The reviewer should be either the poster or the tasker of the job
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if the job is completed or ready for payment
    if (job.status !== 'completed' && job.status !== 'ready_for_payment') {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be submitted once work is submitted and ready for payment",
      });
    }

    // Verify that the reviewer is either the poster or the tasker of the job
    const isPoster = reviewerId === job.poster_id;
    const isTasker = job.tasker_id && reviewerId === job.tasker_id;

    // Also check if user has an accepted application for this job (in case tasker_id not set)
    let hasAcceptedApplication = false;
    if (!isPoster && !isTasker) {
      const pool = require("../config/database");
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          `SELECT id FROM applications
           WHERE job_id = ? AND tasker_id = ? AND status = 'accepted'
           LIMIT 1`,
          [job.id, reviewerId]
        );
        hasAcceptedApplication = rows.length > 0;
      } finally {
        connection.release();
      }
    }

    if (!isPoster && !isTasker && !hasAcceptedApplication) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to review this job",
      });
    }

    // Verify that reviewer is not reviewing themselves
    if (reviewerId === reviewee_id) {
      return res.status(400).json({
        success: false,
        message: "You cannot review yourself",
      });
    }

    // Verify that the reviewee exists as a user
    const revieweeUser = await User.findById(reviewee_id);
    if (!revieweeUser) {
      return res.status(404).json({
        success: false,
        message: "Reviewee user not found",
      });
    }

    // Check if a review already exists for this job and reviewer combination
    const existingReview = await Review.findByJobId(job_id);
    const reviewFromSameReviewer = existingReview.find(review => review.reviewer_id === reviewerId);
    if (reviewFromSameReviewer) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this job",
      });
    }

    // Create review
    const reviewData = {
      job_id,
      reviewer_id: reviewerId,
      reviewee_id,
      rating,
      comment: comment || null,
    };

    const review = await Review.create(reviewData);

    // Create notification for the reviewee
    await Notification.create({
      user_id: reviewee_id,
      type: 'review_received',
      title: 'New Review Received',
      message: `You received a ${rating}-star review for job: ${job.title}`
    });

    // Update rating asynchronously to prevent timeout issues
    // This operation can take time if the user has many reviews
    setImmediate(async () => {
      try {
        await User.updateRating(reviewee_id);
      } catch (error) {
        console.error("Error updating user rating in background:", error);
      }
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("createReview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

// ===============================
// GET REVIEW BY ID
// ===============================

exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user is authorized to view this review
    // Either the reviewer, reviewee, or admin can view
    if (req.userId !== review.reviewer_id && req.userId !== review.reviewee_id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this review",
      });
    }

    res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("getReviewById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
};

// ===============================
// GET REVIEWS FOR JOB
// ===============================

exports.getReviewsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify that job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Reviews are public - anyone can view them
    const reviews = await Review.findByJobId(jobId);

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("getReviewsForJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews for job",
      error: error.message,
    });
  }
};

// ===============================
// GET REVIEWS FOR USER (as reviewee)
// ===============================

exports.getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Users can view their own reviews or others' reviews
    if (currentUserId !== parseInt(userId)) {
      // For now, allow viewing others' reviews publicly
      // In a real system, you might want to restrict this based on privacy settings
    }

    const reviews = await Review.findByUserAsReviewee(userId);

    // Get user's average rating
    const ratingInfo = await Review.getAverageRatingForUser(userId);

    res.json({
      success: true,
      reviews,
      ratingInfo,
    });
  } catch (error) {
    console.error("getReviewsForUser error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews for user",
      error: error.message,
    });
  }
};

// ===============================
// GET REVIEWS BY USER (as reviewer)
// ===============================

exports.getReviewsByUser = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const reviews = await Review.findByUserAsReviewer(currentUserId);

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("getReviewsByUser error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews by user",
      error: error.message,
    });
  }
};

// ===============================
// GET USER RATING
// ===============================

exports.getUserRating = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // For now, allow viewing others' ratings publicly
    // In a real system, you might want to restrict this based on privacy settings

    const ratingInfo = await User.getRating(userId);

    res.json({
      success: true,
      ratingInfo,
    });
  } catch (error) {
    console.error("getUserRating error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user rating",
      error: error.message,
    });
  }
};
