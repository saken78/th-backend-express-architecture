const pool = require("../config/database");

class Category {
  /**
   * Find all categories
   */
  static async findAll() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT id, name, description FROM categories ORDER BY name ASC"
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Find category by ID
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT id, name, description FROM categories WHERE id = ?",
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Find category by name
   */
  static async findByName(name) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT id, name, description FROM categories WHERE name = ?",
        [name]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }
}

module.exports = Category;
