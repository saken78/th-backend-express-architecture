/**
 * Payment Method Model
 * Untuk menyimpan metode pembayaran (kartu, bank, dll)
 */

const pool = require("../config/database");

class PaymentMethod {
  /**
   * Create payment method
   */
  static async create(userId, data) {
    const connection = await pool.getConnection();
    try {
      const { type, card_number, card_holder, expiry_month, expiry_year, cvv, is_default } = data;

      const [result] = await connection.execute(
        `INSERT INTO payment_methods 
         (user_id, type, card_number, card_holder, expiry_month, expiry_year, cvv, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [userId, type, card_number, card_holder, expiry_month, expiry_year, cvv, is_default || false]
      );

      return result.insertId;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all payment methods for user
   */
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, user_id, type,
                SUBSTRING(card_number, 1, 1) as card_first_digit,
                CONCAT('****', SUBSTRING(card_number, -4)) as card_last_four,
                card_holder, expiry_month, expiry_year, is_default, created_at
         FROM payment_methods
         WHERE user_id = ?
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get payment method by ID
   */
  static async findById(id, userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, user_id, type,
                SUBSTRING(card_number, 1, 1) as card_first_digit,
                CONCAT('****', SUBSTRING(card_number, -4)) as card_last_four,
                card_holder, expiry_month, expiry_year, is_default, created_at
         FROM payment_methods
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Update payment method (set as default, etc)
   */
  static async update(id, userId, data) {
    const connection = await pool.getConnection();
    try {
      const { is_default } = data;

      // If setting as default, unset other defaults first
      if (is_default) {
        await connection.execute(
          `UPDATE payment_methods SET is_default = false WHERE user_id = ? AND id != ?`,
          [userId, id]
        );
      }

      await connection.execute(
        `UPDATE payment_methods SET is_default = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [is_default || false, id, userId]
      );

      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete payment method
   */
  static async delete(id, userId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM payment_methods WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get default payment method for user
   */
  static async getDefault(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, user_id, type,
                SUBSTRING(card_number, 1, 1) as card_first_digit,
                CONCAT('****', SUBSTRING(card_number, -4)) as card_last_four,
                card_holder, expiry_month, expiry_year, is_default
         FROM payment_methods
         WHERE user_id = ? AND is_default = true
         LIMIT 1`,
        [userId]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }
}

module.exports = PaymentMethod;
