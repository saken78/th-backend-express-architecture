const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper to get full avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;

  // If already full URL, extract pathname
  if (avatarPath.startsWith('http')) {
    try {
      const parsedUrl = new URL(avatarPath);
      avatarPath = parsedUrl.pathname;
    } catch (error) {
      console.log(`Error parsing avatar URL:`, avatarPath, error)
      return null;
    }
  }

  if(!avatarPath.startsWith('/')) {
    avatarPath = '/' + avatarPath;
  }

  // Add backend URL
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${backendUrl}${avatarPath}`;
};

// ===============================
// AVATAR UPLOAD CONFIG
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/avatars";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `user_${req.userId}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

// Export multer middleware
exports.uploadAvatar = upload.single("avatar");

// ===============================
// GET PROFILE
// ===============================

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      profile: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio,
        avatar: getAvatarUrl(user.avatar),
        role: user.role,
      },
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil profil",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE PROFILE
// ===============================

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, bio } = req.body;

    const updatedUser = await User.updateProfile(req.userId, {
      firstName,
      lastName,
      phone,
      bio,
    });

    // Debug: Log what we got from database
    console.log('📝 Updated user from DB:', updatedUser);

    // Return profile in same format as getProfile
    res.json({
      success: true,
      message: "Profil berhasil diperbarui",
      profile: {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        avatar: getAvatarUrl(updatedUser.avatar),
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui profil",
      error: error.message,
    });
  }
};

// ===============================
// UPLOAD AVATAR
// ===============================

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada file yang diupload",
      });
    }

    const filePath = `/uploads/avatars/${req.file.filename}`;

    // Update DB
    await User.updateAvatar(req.userId, filePath);

    res.json({
      success: true,
      message: "Avatar berhasil diperbarui",
      avatarUrl: getAvatarUrl(filePath),
    });
  } catch (error) {
    console.error("updateAvatar error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal upload avatar",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE ROLE
// ===============================

exports.updateRole = async (req, res) => {
  try {
    console.log('🔍 updateRole request received:', {
      body: req.body,
      userId: req.userId,
      headers: req.headers
    });

    const { role } = req.body;

    // Normalize role to lowercase for comparison
    const normalizedRole = role ? role.toLowerCase() : null;

    // Validate role
    if (!normalizedRole || !['poster', 'tasker'].includes(normalizedRole)) {
      console.log('❌ Invalid role received:', role, 'normalized to:', normalizedRole);
      return res.status(400).json({
        success: false,
        message: "Role tidak valid. Gunakan 'poster' atau 'tasker'",
        receivedRole: role
      });
    }

    // Use the normalized role for the update
    const updatedUser = await User.updateRole(req.userId, { role: normalizedRole });

    console.log('✅ Role updated successfully for user:', req.userId, 'to role:', normalizedRole);

    res.json({
      success: true,
      message: "Role berhasil diperbarui",
      role: normalizedRole, // Return the normalized role
    });
  } catch (error) {
    console.error("updateRole error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui role",
      error: error.message,
    });
  }
};

// ===============================
// GET SETTINGS
// ===============================

exports.getSettings = async (req, res) => {
  try {
    const settings = await User.getSettings(req.userId);

    res.json({
      success: true,
      settings: settings || {
        notifications_enabled: true,
        email_new_applications: true,
        email_job_updates: true,
        email_messages: true,
        email_reviews: true,
        sms_notifications: false,
        push_notifications: true,
      },
    });
  } catch (error) {
    console.error("getSettings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE SETTINGS
// ===============================

exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    // Validate settings is an object
    if (typeof settings !== 'object' || settings === null) {
      return res.status(400).json({
        success: false,
        message: "Settings must be an object",
      });
    }

    const updatedSettings = await User.updateSettings(req.userId, settings);

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("updateSettings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE APPEARANCE SETTINGS
// ===============================

exports.updateAppearance = async (req, res) => {
  try {
    const appearanceSettings = req.body;

    // Validate appearanceSettings is an object
    if (typeof appearanceSettings !== 'object' || appearanceSettings === null) {
      return res.status(400).json({
        success: false,
        message: "Appearance settings must be an object",
      });
    }

    // Get current settings
    const currentSettings = await User.getSettings(req.userId);
    const currentSettingsObj = currentSettings || {};

    // Merge appearance settings with existing settings
    const updatedSettings = {
      ...currentSettingsObj,
      appearance: {
        ...((currentSettingsObj.appearance) || {}),
        ...appearanceSettings
      }
    };

    const result = await User.updateSettings(req.userId, updatedSettings);

    res.json({
      success: true,
      message: "Appearance settings updated successfully",
      settings: result,
    });
  } catch (error) {
    console.error("updateAppearance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appearance settings",
      error: error.message,
    });
  }
};

// ===============================
// DELETE ACCOUNT
// ===============================

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    // Delete user account (soft delete or hard delete)
    const result = await User.deleteAccount(userId);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("deleteAccount error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};
