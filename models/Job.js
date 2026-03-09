/**
 * Job Model
 */

const pool = require("../config/database");

class Job {
  static async create(jobData) {
    const connection = await pool.getConnection();
    try {
      const {
        poster_id,
        title,
        description,
        category_id,
        budget,
        deadline,
        location,
        status = "open", // Default to "open" if not provided
        work_type,
        commitment,
        experience_level,
        payment_type,
        skills,
      } = jobData;

      const [result] = await connection.execute(
        `INSERT INTO jobs
         (poster_id, title, description, category_id, budget,
          deadline, location, status, work_type, commitment,
          experience_level, payment_type, skills)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          poster_id,
          title,
          description,
          category_id || null,
          budget,
          deadline || null,
          location || null,
          status,
          work_type || null,
          commitment || null,
          experience_level || null,
          payment_type || null,
          skills || null,
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
        `SELECT j.*, u.name as poster_name, u.email as poster_email,
                c.name as category_name
         FROM jobs j
         LEFT JOIN users u ON j.poster_id = u.id
         LEFT JOIN categories c ON j.category_id = c.id
         WHERE j.id = ?`,
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async findByPosterId(posterId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT j.*, c.name as category_name
         FROM jobs j
         LEFT JOIN categories c ON j.category_id = c.id
         WHERE j.poster_id = ?
         ORDER BY j.created_at DESC`,
        [posterId]
      );
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

      Object.keys(data).forEach((key) => {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);

      const query = `UPDATE jobs SET ${fields.join(", ")} WHERE id = ?`;
      await connection.execute(query, values);
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      // Delete related saved jobs first
      const SavedJob = require("./SavedJob");
      await SavedJob.deleteByJobId(id);

      // Then delete the job
      await connection.execute("DELETE FROM jobs WHERE id = ?", [id]);
    } finally {
      connection.release();
    }
  }

  static async findAllWithFilters(filters = {}, options = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT j.*,
                   u.name as poster_name,
                   c.name as category_name,
                   u.email as poster_email,
                   u.avatar as poster_avatar
                   FROM jobs j
                   LEFT JOIN users u ON j.poster_id = u.id
                   LEFT JOIN categories c ON j.category_id = c.id
                   WHERE 1=1`;

      const params = [];

      // Apply filters
      if (filters.category_id) {
        query += " AND j.category_id = ?";
        params.push(filters.category_id);
      }

      if (filters.status) {
        query += " AND j.status = ?";
        params.push(filters.status);
      }

      if (filters.location) {
        query += " AND j.location LIKE ?";
        params.push(`%${filters.location}%`);
      }

      if (filters.minBudget) {
        query += " AND j.budget >= ?";
        params.push(filters.minBudget);
      }

      if (filters.maxBudget) {
        query += " AND j.budget <= ?";
        params.push(filters.maxBudget);
      }

      if (filters.search) {
        query += " AND (j.title LIKE ? OR j.description LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.work_type) {
        query += " AND j.work_type = ?";
        params.push(filters.work_type);
      }

      if (filters.commitment) {
        query += " AND j.commitment = ?";
        params.push(filters.commitment);
      }

      if (filters.experience_level) {
        query += " AND j.experience_level = ?";
        params.push(filters.experience_level);
      }

      if (filters.payment_type) {
        query += " AND j.payment_type = ?";
        params.push(filters.payment_type);
      }

      // Apply sorting
      const sortField = options.sort?.field || "created_at";
      const sortOrder = options.sort?.order || "DESC";
      const allowedSortFields = ["created_at", "budget", "deadline", "title"];

      const actualSortField = allowedSortFields.includes(sortField)
        ? sortField
        : "created_at";
      query += ` ORDER BY j.${actualSortField} ${sortOrder}`;

      // Apply pagination
      if (options.limit) {
        query += " LIMIT ? OFFSET ?";
        params.push(options.limit, options.offset || 0);
      }

      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM jobs j WHERE 1=1`;
      const countParams = [];

      if (filters.category_id) {
        countQuery += " AND j.category_id = ?";
        countParams.push(filters.category_id);
      }

      if (filters.status) {
        countQuery += " AND j.status = ?";
        countParams.push(filters.status);
      }

      if (filters.location) {
        countQuery += " AND j.location LIKE ?";
        countParams.push(`%${filters.location}%`);
      }

      if (filters.minBudget) {
        countQuery += " AND j.budget >= ?";
        countParams.push(filters.minBudget);
      }

      if (filters.maxBudget) {
        countQuery += " AND j.budget <= ?";
        countParams.push(filters.maxBudget);
      }

      if (filters.search) {
        countQuery += " AND (j.title LIKE ? OR j.description LIKE ?)";
        countParams.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.work_type) {
        countQuery += " AND j.work_type = ?";
        countParams.push(filters.work_type);
      }

      if (filters.commitment) {
        countQuery += " AND j.commitment = ?";
        countParams.push(filters.commitment);
      }

      if (filters.experience_level) {
        countQuery += " AND j.experience_level = ?";
        countParams.push(filters.experience_level);
      }

      if (filters.payment_type) {
        countQuery += " AND j.payment_type = ?";
        countParams.push(filters.payment_type);
      }

      const [countResult] = await connection.execute(countQuery, countParams);
      const total = countResult[0].total;

      // Execute main query
      const [rows] = await connection.execute(query, params);

      return {
        jobs: rows,
        total,
      };
    } finally {
      connection.release();
    }
  }

  static async findCompletedJobsByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      // Query to get completed jobs where user is either poster or tasker
      const query = `
        SELECT DISTINCT j.*,
               u.name as poster_name,
               c.name as category_name,
               u.email as poster_email,
               u.avatar as poster_avatar,
               'poster' as role_in_job
        FROM jobs j
        LEFT JOIN users u ON j.poster_id = u.id
        LEFT JOIN categories c ON j.category_id = c.id
        WHERE j.status = 'completed' AND j.poster_id = ?

        UNION

        SELECT DISTINCT j.*,
               u.name as poster_name,
               c.name as category_name,
               u.email as poster_email,
               u.avatar as poster_avatar,
               'tasker' as role_in_job
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        LEFT JOIN users u ON j.poster_id = u.id
        LEFT JOIN categories c ON j.category_id = c.id
        WHERE j.status = 'completed'
          AND a.tasker_id = ?
          AND a.status = 'accepted'
      `;

      const [rows] = await connection.execute(query, [userId, userId]);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = Job;
