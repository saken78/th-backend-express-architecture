/**
 * SupportTicket Model
 * Handles support ticket operations
 */

const pool = require("../config/database");

class SupportTicket {
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO support_tickets (user_id, subject, description, category, priority)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.user_id,
          data.subject,
          data.description,
          data.category || null,
          data.priority || 'medium'
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
        `SELECT st.*, u.name as user_name, u.email as user_email
         FROM support_tickets st
         LEFT JOIN users u ON st.user_id = u.id
         WHERE st.id = ?`,
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findAll(options = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT st.*, u.name as user_name, u.email as user_email
                   FROM support_tickets st
                   LEFT JOIN users u ON st.user_id = u.id
                   WHERE 1=1`;
      const params = [];

      if (options.status) {
        query += " AND st.status = ?";
        params.push(options.status);
      }

      if (options.priority) {
        query += " AND st.priority = ?";
        params.push(options.priority);
      }

      query += " ORDER BY st.created_at DESC";

      if (options.limit) {
        query += " LIMIT ? OFFSET ?";
        params.push(options.limit, options.offset || 0);
      }

      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async update(id, data) {
    const connection = await pool.getConnection();
    try {
      const fields = [];
      const values = [];

      Object.keys(data).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);
      const query = `UPDATE support_tickets SET ${fields.join(", ")} WHERE id = ?`;
      await connection.execute(query, values);
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.execute("DELETE FROM support_tickets WHERE id = ?", [id]);
    } finally {
      connection.release();
    }
  }
}

module.exports = SupportTicket;
