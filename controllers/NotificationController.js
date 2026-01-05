/**
 * Notification Controller
 */

const Notification = require("../models/Notification");

// ===============================
// GET USER NOTIFICATIONS
// ===============================

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { isRead, limit = 10 } = req.query;

    const options = {};
    if (isRead !== undefined) {
      options.isRead = isRead === 'true';
    }
    if (limit) {
      options.limit = parseInt(limit);
    }

    const notifications = await Notification.findByUserId(userId, options);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("getUserNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// ===============================
// MARK NOTIFICATION AS READ
// ===============================

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify that the notification belongs to the user
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this notification",
      });
    }

    await Notification.markAsRead(id);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// ===============================
// MARK ALL NOTIFICATIONS AS READ
// ===============================

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// ===============================
// DELETE NOTIFICATION
// ===============================

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify that the notification belongs to the user
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this notification",
      });
    }

    await Notification.delete(id);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};