/**
 * Support Controller
 * Handles support ticket operations
 */

const SupportTicket = require("../models/SupportTicket");

// ===============================
// CREATE SUPPORT TICKET
// ===============================

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority. Must be one of: low, medium, high, urgent",
      });
    }

    // Create ticket
    const ticketId = await SupportTicket.create({
      user_id: userId,
      subject,
      description,
      category: category || null,
      priority: priority || 'medium',
    });

    // Fetch created ticket
    const ticket = await SupportTicket.findById(ticketId);

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("createTicket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
      error: error.message,
    });
  }
};

// ===============================
// GET TICKET BY ID
// ===============================

exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    // Check authorization - user can only view their own tickets
    if (ticket.user_id !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only view your own tickets",
      });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("getTicket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support ticket",
      error: error.message,
    });
  }
};

// ===============================
// GET MY TICKETS
// ===============================

exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.userId;
    const tickets = await SupportTicket.findByUserId(userId);

    res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("getMyTickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your support tickets",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE TICKET STATUS
// ===============================

exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    // Check if ticket exists
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    // Check authorization
    if (ticket.user_id !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only update your own tickets",
      });
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    // Prepare update data
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Update ticket
    await SupportTicket.update(id, updateData);
    const updatedTicket = await SupportTicket.findById(id);

    res.json({
      success: true,
      message: "Support ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("updateTicket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update support ticket",
      error: error.message,
    });
  }
};

// ===============================
// DELETE TICKET
// ===============================

exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    // Check authorization
    if (ticket.user_id !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own tickets",
      });
    }

    await SupportTicket.delete(id);

    res.json({
      success: true,
      message: "Support ticket deleted successfully",
    });
  } catch (error) {
    console.error("deleteTicket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete support ticket",
      error: error.message,
    });
  }
};
