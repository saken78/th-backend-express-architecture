/**
 * Chat Controller
 */

const Chat = require("../models/Chat");
const Job = require("../models/Job");
const Application = require("../models/Application");

// ===============================
// CREATE CONVERSATION
// ===============================

exports.createConversation = async (req, res) => {
  try {
    const { job_id, other_user_id } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!job_id || !other_user_id) {
      return res.status(400).json({
        success: false,
        message: "Job ID and other user ID are required",
      });
    }

    // Verify that the job exists
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify that the current user is associated with the job
    // Either the poster or the accepted tasker can start a conversation
    let isValidUser = false;
    
    // Check if user is the poster
    if (job.poster_id === userId) {
      isValidUser = true;
    } else {
      // Check if user is the accepted tasker
      const applications = await Application.findByJobId(job_id);
      const acceptedApplication = applications.find(app => app.status === 'accepted');
      if (acceptedApplication && acceptedApplication.tasker_id === userId) {
        isValidUser = true;
      }
    }

    if (!isValidUser) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create a conversation for this job",
      });
    }

    // Verify that the other user is also associated with the job
    if (job.poster_id !== other_user_id) {
      const applications = await Application.findByJobId(job_id);
      const acceptedApplication = applications.find(app => app.status === 'accepted');
      if (!acceptedApplication || acceptedApplication.tasker_id !== other_user_id) {
        return res.status(403).json({
          success: false,
          message: "The other user is not associated with this job",
        });
      }
    }

    // Create conversation
    const conversationId = await Chat.createConversation(job_id, userId, other_user_id);

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation_id: conversationId,
    });
  } catch (error) {
    console.error("createConversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

// ===============================
// GET CONVERSATION BY ID
// ===============================

exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await Chat.getConversationById(id, userId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not authorized to access it",
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("getConversationById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
      error: error.message,
    });
  }
};

// ===============================
// GET USER CONVERSATIONS
// ===============================

exports.getConversationsForUser = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Chat.getConversationsForUser(userId);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("getConversationsForUser error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

// ===============================
// SEND MESSAGE
// ===============================

exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { message, message_type } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Verify that the user is part of the conversation
    const conversation = await Chat.getConversationById(conversation_id, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not authorized to access it",
      });
    }

    // Create message
    const newMessage = await Chat.createMessage(
      conversation_id,
      userId,
      message,
      message_type || 'text'
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      message: newMessage,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// ===============================
// GET MESSAGES FOR CONVERSATION
// ===============================

exports.getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify that the user is part of the conversation
    const conversation = await Chat.getConversationById(conversation_id, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not authorized to access it",
      });
    }

    const messages = await Chat.getMessages(conversation_id, userId, parseInt(limit), parseInt(offset));

    // Mark messages as read
    await Chat.markMessagesAsRead(conversation_id, userId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// ===============================
// GET UNREAD COUNT
// ===============================

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Chat.getUnreadCount(userId);

    res.json({
      success: true,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};