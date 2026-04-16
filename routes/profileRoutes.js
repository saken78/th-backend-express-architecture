const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const profileController = require("../controllers/profileController");

// GET profile
router.get("/profile", verifyToken, profileController.getProfile);

// UPDATE profile
router.put("/profile", verifyToken, profileController.updateProfile);

// Upload avatar
router.post(
  "/profile/avatar",
  verifyToken,
  profileController.uploadAvatar, // ← multer
  profileController.updateAvatar,
);

// UPDATE role
router.put("/role", verifyToken, profileController.updateRole);

// Settings endpoints
// GET settings
router.get("/settings", verifyToken, profileController.getSettings);

// UPDATE settings
router.put("/settings", verifyToken, profileController.updateSettings);

// UPDATE appearance settings
router.put("/appearance", verifyToken, profileController.updateAppearance);

// DELETE account
router.delete("/account", verifyToken, profileController.deleteAccount);

module.exports = router;
