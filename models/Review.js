/**
 * Review Model
 */

const pool = require("../config/database");

class Review {
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // Create the review record
      const [reviewResult] = await connection.execute(
        `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.job_id,
          data.reviewer_id,
          data.reviewee_id,
          data.rating,
          data.comment || null
        ]
      );

      const reviewId = reviewResult.insertId;

      // Update the reviewee's rating
      // Rating update moved to controller for async processing
      // await require("./User").updateRating(data.reviewee_id);

      // Commit transaction
      await connection.commit();

      // Return the created review
      const [reviewRows] = await connection.execute(
        `SELECT r.*, 
                reviewer.name as reviewer_name, 
                reviewer.avatar as reviewer_avatar,
                reviewee.name as reviewee_name,
                reviewee.avatar as reviewee_avatar,
                j.title as job_title
         FROM reviews r
         LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
         LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
         LEFT JOIN jobs j ON r.job_id = j.id
         WHERE r.id = ?`,
        [reviewId]
      );

      return reviewRows[0];
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT r.*, 
                reviewer.name as reviewer_name, 
                reviewer.avatar as reviewer_avatar,
                reviewee.name as reviewee_name,
                reviewee.avatar as reviewee_avatar,
                j.title as job_title
         FROM reviews r
         LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
         LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
         LEFT JOIN jobs j ON r.job_id = j.id
         WHERE r.id = ?`,
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async findByJobId(jobId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT r.*, 
                reviewer.name as reviewer_name, 
                reviewer.avatar as reviewer_avatar,
                reviewee.name as reviewee_name,
                reviewee.avatar as reviewee_avatar,
                j.title as job_title
         FROM reviews r
         LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
         LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
         LEFT JOIN jobs j ON r.job_id = j.id
         WHERE r.job_id = ?
         ORDER BY r.created_at DESC`,
        [jobId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findByUserAsReviewee(revieweeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT r.*, 
                reviewer.name as reviewer_name, 
                reviewer.avatar as reviewer_avatar,
                reviewee.name as reviewee_name,
                reviewee.avatar as reviewee_avatar,
                j.title as job_title
         FROM reviews r
         LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
         LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
         LEFT JOIN jobs j ON r.job_id = j.id
         WHERE r.reviewee_id = ?
         ORDER BY r.created_at DESC`,
        [revieweeId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findByUserAsReviewer(reviewerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT r.*, 
                reviewer.name as reviewer_name, 
                reviewer.avatar as reviewer_avatar,
                reviewee.name as reviewee_name,
                reviewee.avatar as reviewee_avatar,
                j.title as job_title
         FROM reviews r
         LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
         LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
         LEFT JOIN jobs j ON r.job_id = j.id
         WHERE r.reviewer_id = ?
         ORDER BY r.created_at DESC`,
        [reviewerId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async getAverageRatingForUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          AVG(rating) as avg_rating,
          COUNT(*) as total_reviews
         FROM reviews
         WHERE reviewee_id = ?`,
        [userId]
      );
      return {
        avg_rating: rows[0].avg_rating ? parseFloat(rows[0].avg_rating).toFixed(2) : 0.00,
        total_reviews: rows[0].total_reviews || 0
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = Review;
