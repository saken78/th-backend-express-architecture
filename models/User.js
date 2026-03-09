const pool = require("../config/database");

class User {
  static async create(name, email, password, role = null) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, password, role]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  static async findByEmail(email) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT id, name, email, firstName, lastName, phone, bio, avatar, role FROM users WHERE id = ?",
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async findAll() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC"
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async updateProfile(id, data) {
    const { firstName, lastName, phone, bio } = data;

    await pool.query(
      `
      UPDATE users
      SET firstName = ?, lastName = ?, phone = ?, bio = ?
      WHERE id = ?
    `,
      [firstName, lastName, phone, bio, id]
    );

    // Return updated user
    return this.findById(id);
  }

  static async updateAvatar(id, avatarPath) {
    await pool.query(
      `
      UPDATE users
      SET avatar = ?
      WHERE id = ?
    `,
      [avatarPath, id]
    );

    return this.findById(id);
  }

  static async updateRole(id, data) {
    const { role } = data;

    await pool.query(
      `
      UPDATE users
      SET role = ?
      WHERE id = ?
    `,
      [role, id]
    );

    // Return updated user
    return this.findById(id);
  }

  static async ensureWalletExists(userId) {
    const connection = await pool.getConnection();
    try {
      // Check if wallet already exists
      const [existingWallet] = await connection.execute(
        "SELECT id FROM wallets WHERE user_id = ?",
        [userId]
      );

      if (existingWallet.length > 0) {
        return existingWallet[0].id;
      }

      // Create wallet if it doesn't exist
      const [result] = await connection.execute(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
        [userId]
      );

      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async getWallet(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT w.*, u.name as user_name, u.email as user_email
         FROM wallets w
         JOIN users u ON w.user_id = u.id
         WHERE w.user_id = ?`,
        [userId]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async updateWalletBalance(userId, amount) {
    const connection = await pool.getConnection();
    try {
      // Update wallet balance
      await connection.execute(
        `UPDATE wallets
         SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, userId]
      );

      // Get updated wallet
      const [rows] = await connection.execute(
        "SELECT * FROM wallets WHERE user_id = ?",
        [userId]
      );

      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async ensureWalletExists(userId) {
    const connection = await pool.getConnection();
    try {
      // Check if wallet already exists
      const [existingWallet] = await connection.execute(
        "SELECT id FROM wallets WHERE user_id = ?",
        [userId]
      );

      if (existingWallet.length > 0) {
        return existingWallet[0].id;
      }

      // Create wallet if it doesn't exist
      const [result] = await connection.execute(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
        [userId]
      );

      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async getWallet(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT w.*, u.name as user_name, u.email as user_email
         FROM wallets w
         JOIN users u ON w.user_id = u.id
         WHERE w.user_id = ?`,
        [userId]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async updateRating(userId) {
    const connection = await pool.getConnection();
    try {
      // Calculate average rating and total reviews for the user
      const [ratingResult] = await connection.execute(`
        SELECT
          AVG(r.rating) as avg_rating,
          COUNT(r.id) as total_reviews
        FROM reviews r
        WHERE r.reviewee_id = ?
      `, [userId]);

      const avgRating = ratingResult[0].avg_rating ? parseFloat(ratingResult[0].avg_rating).toFixed(2) : 0.00;
      const totalReviews = ratingResult[0].total_reviews || 0;

      // Update user's rating information
      await connection.execute(`
        UPDATE users
        SET avg_rating = ?, total_reviews = ?
        WHERE id = ?
      `, [avgRating, totalReviews, userId]);

      // Return updated user
      return this.findById(userId);
    } finally {
      connection.release();
    }
  }

  static async getRating(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT avg_rating, total_reviews
        FROM users
        WHERE id = ?
      `, [userId]);

      return rows[0] || { avg_rating: 0.00, total_reviews: 0 };
    } finally {
      connection.release();
    }
  }

  // ✅ Settings Management
  static async getSettings(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT settings FROM users WHERE id = ?",
        [id]
      );
      if (!rows[0]) return null;
      return rows[0].settings ? JSON.parse(rows[0].settings) : null;
    } finally {
      connection.release();
    }
  }

  static async updateSettings(id, settings) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        "UPDATE users SET settings = ? WHERE id = ?",
        [JSON.stringify(settings), id]
      );
      return this.getSettings(id);
    } finally {
      connection.release();
    }
  }

  static async deleteAccount(id) {
    const connection = await pool.getConnection();
    try {
      // Start transaction to ensure data consistency
      await connection.beginTransaction();

      // Delete related data first (to respect foreign key constraints)
      await connection.execute("DELETE FROM user_sessions WHERE user_id = ?", [id]);
      await connection.execute("DELETE FROM user_tokens WHERE user_id = ?", [id]);
      await connection.execute("DELETE FROM applications WHERE applicant_id = ?", [id]);
      await connection.execute("DELETE FROM reviews WHERE reviewer_id = ? OR reviewee_id = ?", [id, id]);
      await connection.execute("DELETE FROM payments WHERE sender_id = ? OR receiver_id = ?", [id, id]);
      await connection.execute("DELETE FROM wallets WHERE user_id = ?", [id]);
      await connection.execute("DELETE FROM jobs WHERE poster_id = ?", [id]);
      await connection.execute("DELETE FROM chat_messages WHERE sender_id = ?", [id]);
      await connection.execute("DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?", [id, id]);

      // Finally delete the user
      await connection.execute("DELETE FROM users WHERE id = ?", [id]);

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = User;
