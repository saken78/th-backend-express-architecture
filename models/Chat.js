/**
 * Chat Model
 */

const pool = require("../config/database");

class Chat {
  // Create a new conversation between two users for a specific job
  static async createConversation(jobId, participant1Id, participant2Id) {
    const connection = await pool.getConnection();
    try {
      // Check if a conversation already exists between these two participants for this job
      const [existingConv] = await connection.execute(
        `SELECT id FROM conversations 
         WHERE job_id = ? AND 
               ((participant1_id = ? AND participant2_id = ?) OR 
                (participant1_id = ? AND participant2_id = ?))`,
        [jobId, participant1Id, participant2Id, participant2Id, participant1Id]
      );

      if (existingConv.length > 0) {
        return existingConv[0].id;
      }

      // Create new conversation
      const [result] = await connection.execute(
        `INSERT INTO conversations (job_id, participant1_id, participant2_id) 
         VALUES (?, ?, ?)`,
        [jobId, participant1Id, participant2Id]
      );

      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // Get conversation by ID
  static async getConversationById(conversationId, userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT c.*, j.title as job_title, j.description as job_description
         FROM conversations c
         LEFT JOIN jobs j ON c.job_id = j.id
         WHERE c.id = ? 
         AND (c.participant1_id = ? OR c.participant2_id = ?)`,
        [conversationId, userId, userId]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  // Get conversation by job and participants
  static async getConversationByJobAndParticipants(jobId, participant1Id, participant2Id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT c.*, j.title as job_title, j.description as job_description
         FROM conversations c
         LEFT JOIN jobs j ON c.job_id = j.id
         WHERE c.job_id = ? AND 
               ((c.participant1_id = ? AND c.participant2_id = ?) OR 
                (c.participant1_id = ? AND c.participant2_id = ?))`,
        [jobId, participant1Id, participant2Id, participant2Id, participant1Id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  // Get all conversations for a user
  static async getConversationsForUser(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT c.*, 
                j.title as job_title,
                u1.name as participant1_name, u1.avatar as participant1_avatar,
                u2.name as participant2_name, u2.avatar as participant2_avatar,
                (SELECT COUNT(*) FROM messages m 
                 WHERE m.conversation_id = c.id AND m.read_status = FALSE 
                 AND m.sender_id != ?) as unread_count,
                (SELECT m.message FROM messages m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT m.created_at FROM messages m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.created_at DESC LIMIT 1) as last_message_time
         FROM conversations c
         LEFT JOIN jobs j ON c.job_id = j.id
         LEFT JOIN users u1 ON c.participant1_id = u1.id
         LEFT JOIN users u2 ON c.participant2_id = u2.id
         WHERE c.participant1_id = ? OR c.participant2_id = ?
         ORDER BY c.updated_at DESC`,
        [userId, userId, userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Create a new message in a conversation
  static async createMessage(conversationId, senderId, message, messageType = 'text') {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO messages (conversation_id, sender_id, message, message_type) 
         VALUES (?, ?, ?, ?)`,
        [conversationId, senderId, message, messageType]
      );

      // Update conversation timestamp
      await connection.execute(
        "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [conversationId]
      );

      // Return the created message with sender info
      const [messageRows] = await connection.execute(
        `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      return messageRows[0];
    } finally {
      connection.release();
    }
  }

  // Get messages for a conversation
  static async getMessages(conversationId, userId, limit = 50, offset = 0) {
    const connection = await pool.getConnection();
    try {
      // Verify user is part of the conversation
      const [convCheck] = await connection.execute(
        `SELECT id FROM conversations 
         WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)`,
        [conversationId, userId, userId]
      );

      if (convCheck.length === 0) {
        throw new Error("Unauthorized: You are not part of this conversation");
      }

      const [rows] = await connection.execute(
        `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at ASC
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(conversationId, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE messages 
         SET read_status = TRUE 
         WHERE conversation_id = ? AND sender_id != ? AND read_status = FALSE`,
        [conversationId, userId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  // Get unread message count for user
  static async getUnreadCount(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as unread_count
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE m.read_status = FALSE 
         AND m.sender_id != ?
         AND (c.participant1_id = ? OR c.participant2_id = ?)`,
        [userId, userId, userId]
      );
      return rows[0]?.unread_count || 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = Chat;