/**
 * Notification Model
 */

const pool = require("../config/database");

class Notification {
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO notifications (user_id, type, title, message) 
         VALUES (?, ?, ?, ?)`,
        [
          data.user_id,
          data.type,
          data.title,
          data.message
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
        `SELECT * FROM notifications WHERE id = ?`,
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId, options = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT * FROM notifications WHERE user_id = ?`;
      const params = [userId];

      if (options.isRead !== undefined) {
        query += ` AND is_read = ?`;
        params.push(options.isRead);
      }

      query += ` ORDER BY created_at DESC`;

      if (options.limit) {
        query += ` LIMIT ?`;
        params.push(options.limit);
      }

      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async markAsRead(id) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE notifications SET is_read = TRUE WHERE id = ?`,
        [id]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async markAllAsRead(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `DELETE FROM notifications WHERE id = ?`,
        [id]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async deleteByUser(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `DELETE FROM notifications WHERE user_id = ?`,
        [userId]
      );
      return true;
    } finally {
      connection.release();
    }
  }
}

module.exports = Notification;