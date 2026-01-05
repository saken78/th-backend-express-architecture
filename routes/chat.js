const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

const chatController = require("../controllers/ChatController");

// ===============================
// CHAT ENDPOINTS
// ===============================

// POST /api/chat/conversations - Create a new conversation (Authenticated users)
router.post(
  "/conversations",
  verifyToken,
  chatController.createConversation
);

// GET /api/chat/conversations/:id - Get conversation by ID (Participants only)
router.get(
  "/conversations/:id",
  verifyToken,
  chatController.getConversationById
);

// GET /api/chat/conversations - Get all conversations for user (Authenticated users)
router.get(
  "/conversations",
  verifyToken,
  chatController.getConversationsForUser
);

// POST /api/chat/conversations/:conversation_id/messages - Send a message (Participants only)
router.post(
  "/conversations/:conversation_id/messages",
  verifyToken,
  chatController.sendMessage
);

// GET /api/chat/conversations/:conversation_id/messages - Get messages for conversation (Participants only)
router.get(
  "/conversations/:conversation_id/messages",
  verifyToken,
  chatController.getMessages
);

// GET /api/chat/unread-count - Get unread message count for user (Authenticated users)
router.get(
  "/unread-count",
  verifyToken,
  chatController.getUnreadCount
);

module.exports = router;