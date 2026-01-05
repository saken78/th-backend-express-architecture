/**
 * SavedJob Model
 */

const db = require("../config/database");

// Create a saved job
exports.create = async (savedJobData) => {
  const { user_id, job_id } = savedJobData;
  
  const query = "INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)";
  const [result] = await db.execute(query, [user_id, job_id]);
  
  return result.insertId;
};

// Find saved jobs by user ID
exports.findByUserId = async (userId) => {
  const query = `
    SELECT sj.id as saved_job_id, sj.user_id, sj.job_id, sj.created_at as saved_at,
           j.id, j.poster_id, j.title, j.description, j.category_id, j.budget, j.status, j.deadline, j.location, j.created_at, j.updated_at,
           u.name as poster_name, u.email as poster_email, u.avatar as poster_avatar
    FROM saved_jobs sj
    JOIN jobs j ON sj.job_id = j.id
    JOIN users u ON j.poster_id = u.id
    WHERE sj.user_id = ?
    ORDER BY sj.created_at DESC
  `;
  const [rows] = await db.execute(query, [userId]);
  return rows;
};

// Find saved job by user ID and job ID
exports.findByUserIdAndJobId = async (userId, jobId) => {
  const query = "SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?";
  const [rows] = await db.execute(query, [userId, jobId]);
  return rows;
};

// Delete saved job by user ID and job ID
exports.deleteByUserIdAndJobId = async (userId, jobId) => {
  const query = "DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?";
  const [result] = await db.execute(query, [userId, jobId]);
  return result.affectedRows;
};

// Check if a job is saved by a user
exports.isJobSavedByUser = async (userId, jobId) => {
  const query = "SELECT COUNT(*) as count FROM saved_jobs WHERE user_id = ? AND job_id = ?";
  const [rows] = await db.execute(query, [userId, jobId]);
  return rows[0].count > 0;
};

// Delete all saved jobs by user ID (useful for cleanup)
exports.deleteByUserId = async (userId) => {
  const query = "DELETE FROM saved_jobs WHERE user_id = ?";
  const [result] = await db.execute(query, [userId]);
  return result.affectedRows;
};

// Delete all saved jobs by job ID (useful when a job is deleted)
exports.deleteByJobId = async (jobId) => {
  const query = "DELETE FROM saved_jobs WHERE job_id = ?";
  const [result] = await db.execute(query, [jobId]);
  return result.affectedRows;
};