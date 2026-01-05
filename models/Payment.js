/**
 * Payment Model
 */

const pool = require("../config/database");

class Payment {
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // Create the payment record
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments (job_id, sender_id, receiver_id, amount, status, payment_method, transaction_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.job_id,
          data.sender_id,
          data.receiver_id,
          data.amount,
          data.status || 'pending',
          data.payment_method || null,
          data.transaction_id || null
        ]
      );

      const paymentId = paymentResult.insertId;

      // Update job status to 'completed' if payment is successful
      if (data.status === 'completed') {
        await connection.execute(
          "UPDATE jobs SET status = 'completed' WHERE id = ?",
          [data.job_id]
        );
      }

      // Commit transaction
      await connection.commit();

      // Return the created payment
      return paymentId;
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
        `SELECT p.*, j.title as job_title, 
                s.name as sender_name, s.email as sender_email,
                r.name as receiver_name, r.email as receiver_email
         FROM payments p
         LEFT JOIN jobs j ON p.job_id = j.id
         LEFT JOIN users s ON p.sender_id = s.id
         LEFT JOIN users r ON p.receiver_id = r.id
         WHERE p.id = ?`,
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
        `SELECT p.*, j.title as job_title,
                s.name as sender_name, s.email as sender_email,
                r.name as receiver_name, r.email as receiver_email
         FROM payments p
         LEFT JOIN jobs j ON p.job_id = j.id
         LEFT JOIN users s ON p.sender_id = s.id
         LEFT JOIN users r ON p.receiver_id = r.id
         WHERE p.job_id = ?
         ORDER BY p.created_at DESC`,
        [jobId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId, role = 'sender') {
    const connection = await pool.getConnection();
    try {
      const field = role === 'sender' ? 'sender_id' : 'receiver_id';
      const [rows] = await connection.execute(
        `SELECT p.*, j.title as job_title,
                s.name as sender_name, s.email as sender_email,
                r.name as receiver_name, r.email as receiver_email
         FROM payments p
         LEFT JOIN jobs j ON p.job_id = j.id
         LEFT JOIN users s ON p.sender_id = s.id
         LEFT JOIN users r ON p.receiver_id = r.id
         WHERE p.${field} = ?
         ORDER BY p.created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id, status) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        "UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async processPayment(jobId, senderId, receiverId, amount) {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // Ensure receiver has a wallet (create if doesn't exist)
      const [existingWallet] = await connection.execute(
        "SELECT id FROM wallets WHERE user_id = ?",
        [receiverId]
      );

      let walletId;
      if (existingWallet.length === 0) {
        // Create wallet if it doesn't exist
        const [walletResult] = await connection.execute(
          "INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
          [receiverId]
        );
        walletId = walletResult.insertId;
      } else {
        walletId = existingWallet[0].id;
      }

      // Create payment record with 'completed' status
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments (job_id, sender_id, receiver_id, amount, status)
         VALUES (?, ?, ?, ?, 'completed')`,
        [jobId, senderId, receiverId, amount]
      );

      const paymentId = paymentResult.insertId;

      // Update job status to 'completed'
      await connection.execute(
        "UPDATE jobs SET status = 'completed' WHERE id = ?",
        [jobId]
      );

      // Update receiver's wallet balance (credit)
      await connection.execute(
        `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
        [amount, walletId]
      );

      // Create transaction record for the receiver
      await connection.execute(
        `INSERT INTO transactions (wallet_id, type, amount, description, reference_id, reference_type)
         VALUES (?, 'credit', ?, 'Payment for job completion', ?, 'payment')`,
        [walletId, amount, paymentId]
      );

      // Commit transaction
      await connection.commit();

      // Return the created payment
      const [paymentRows] = await connection.execute(
        `SELECT p.*, j.title as job_title,
                s.name as sender_name, s.email as sender_email,
                r.name as receiver_name, r.email as receiver_email
         FROM payments p
         LEFT JOIN jobs j ON p.job_id = j.id
         LEFT JOIN users s ON p.sender_id = s.id
         LEFT JOIN users r ON p.receiver_id = r.id
         WHERE p.id = ?`,
        [paymentId]
      );

      return paymentRows[0];
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Payment;