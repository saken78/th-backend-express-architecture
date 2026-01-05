/**
 * Application Model
 */

const pool = require("../config/database");

class Application {
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO applications (job_id, tasker_id, proposal, proposed_budget) 
         VALUES (?, ?, ?, ?)`,
        [
          data.job_id,
          data.tasker_id,
          data.proposal,
          data.proposed_budget
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT a.*,
                j.title as job_title, j.description as job_description, j.budget as job_budget,
                u.id as user_id, u.name as user_name, u.email as user_email, u.bio as user_experience
         FROM applications a
         LEFT JOIN jobs j ON a.job_id = j.id
         LEFT JOIN users u ON a.tasker_id = u.id
         WHERE a.id = ?`,
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
        `SELECT a.*,
                j.title as job_title, j.budget as job_budget, j.status as job_status,
                u.name as tasker_name, u.email as tasker_email, u.avatar as tasker_avatar
         FROM applications a
         LEFT JOIN jobs j ON a.job_id = j.id
         LEFT JOIN users u ON a.tasker_id = u.id
         WHERE a.job_id = ?
         ORDER BY a.created_at DESC`,
        [jobId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findByTaskerId(taskerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT a.*, j.title as job_title, j.description as job_description, 
                j.budget as job_budget, j.status as job_status, u.name as poster_name
         FROM applications a
         LEFT JOIN jobs j ON a.job_id = j.id
         LEFT JOIN users u ON j.poster_id = u.id
         WHERE a.tasker_id = ?
         ORDER BY a.created_at DESC`,
        [taskerId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findByJobAndTasker(jobId, taskerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM applications WHERE job_id = ? AND tasker_id = ?`,
        [jobId, taskerId]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id, status) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        "UPDATE applications SET status = ? WHERE id = ?",
        [status, id]
      );
    } finally {
      connection.release();
    }
  }
}

module.exports = Application;