/**
 * Express Server dengan HttpOnly Cookie Authentication
 */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const User = require("./models/User");

const profileRoutes = require("./routes/profileRoutes");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const paymentRoutes = require("./routes/payments");
const paymentMethodRoutes = require("./routes/paymentMethods");
const ratingRoutes = require("./routes/ratings");
const chatRoutes = require("./routes/chat");
const supportRoutes = require("./routes/support");
const categoryRoutes = require("./routes/categories");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

// CORS - IMPORTANT: Must allow credentials!
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    optionsSuccessStatus: 200,
  }),
);

// Parse JSON
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Serve uploaded files (avatars)
app.use("/uploads", express.static("uploads"));

// ===============================
// ROUTES
// ===============================

// Auth routes
app.use("/api/auth", authRoutes);

// Profile routes
app.use("/api/user", profileRoutes);

// Job routes
app.use("/api/jobs", jobRoutes);

// Application routes
app.use("/api/applications", applicationRoutes);

// Rating and Review routes
app.use("/api/ratings", ratingRoutes);

// Payment Methods routes (must come before general payments route)
app.use("/api/payments/methods", paymentMethodRoutes);

// Payment routes
app.use("/api/payments", paymentRoutes);

// Chat routes
app.use("/api/chat", chatRoutes);

// ✅ Support routes
app.use("/api/support", supportRoutes);

// ✅ Category routes
app.use("/api/categories", categoryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Debug: Check auth status and cookies
app.get("/api/debug/auth-status", (req, res) => {
  const token = req.cookies.auth_token;
  res.json({
    success: true,
    hasAuthCookie: !!token,
    authTokenExists: !!token,
    allCookies: Object.keys(req.cookies),
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
    },
    nodeEnv: process.env.NODE_ENV,
    message: token ? "Auth cookie present" : "No auth cookie found",
  });
});

// Get all users (for testing)
app.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      message: "Daftar user yang sudah terdaftar",
      total: users.length,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
      error: error.message,
    });
  }
});

// ===============================
// ERROR HANDLING
// ===============================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ===============================
// START SERVER (Local Development)
// ===============================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `✅ CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
    );
    console.log(`✅ HttpOnly cookies enabled`);
    console.log("=".repeat(60));
    console.log("\n📚 Available Endpoints:");
    console.log("   Auth:");
    console.log("   - POST   /api/auth/register");
    console.log("   - POST   /api/auth/login");
    console.log("   - POST   /api/auth/logout (protected)");
    console.log("   - GET    /api/auth/csrf-token (protected)");
    console.log("   - GET    /api/auth/me (protected)");
    console.log("\n   Profile:");
    console.log("   - GET    /api/user/profile (protected)");
    console.log("   - PUT    /api/user/profile (protected)");
    console.log("   - POST   /api/user/profile/avatar (protected)");
    console.log("   - PUT    /api/user/role (protected)");
    console.log("\n   Jobs:");
    console.log("   - POST   /api/jobs (protected, poster only)");
    console.log("   - GET    /api/jobs");
    console.log("   - GET    /api/jobs/:id");
    console.log("   - PUT    /api/jobs/:id (protected, poster only)");
    console.log("   - DELETE /api/jobs/:id (protected, poster only)");
    console.log("   - GET    /api/jobs/my-jobs (protected, poster only)");
    console.log("   - GET    /api/jobs/saved (protected)");
    console.log("   - POST   /api/jobs/:id/save (protected)");
    console.log("   - DELETE /api/jobs/:id/save (protected)");
    console.log("\n   Applications:");
    console.log(
      "   - POST   /api/applications/jobs/:id/apply (protected, tasker only)",
    );
    console.log(
      "   - GET    /api/applications/jobs/:id/applications (protected, poster only)",
    );
    console.log(
      "   - PUT    /api/applications/applications/:id/accept (protected, poster only)",
    );
    console.log(
      "   - PUT    /api/applications/applications/:id/reject (protected, poster only)",
    );
    console.log(
      "   - GET    /api/applications/my-applications (protected, tasker only)",
    );
    console.log("   - GET    /api/applications/applications/:id (protected)");
    console.log("\n   Payments:");
    console.log("   - POST   /api/payments (protected, poster only)");
    console.log("   - GET    /api/payments/:id (protected)");
    console.log("   - GET    /api/payments (protected)");
    console.log(
      "   - PUT    /api/payments/:id/refund (protected, sender only)",
    );
    console.log("   - GET    /api/payments/job/:jobId (protected)");
    console.log("   - GET    /api/payments/wallet (protected)");
    console.log("   - POST   /api/payments/wallet/add-funds (protected)");
    console.log("   - POST   /api/payments/wallet/withdraw (protected)");
    console.log("   - GET    /api/payments/wallet/transactions (protected)");
    console.log("\n   Ratings & Reviews:");
    console.log("   - POST   /api/ratings/reviews (protected)");
    console.log("   - GET    /api/ratings/reviews/:id (protected)");
    console.log("   - GET    /api/ratings/jobs/:jobId/reviews (protected)");
    console.log("   - GET    /api/ratings/users/:userId/reviews (protected)");
    console.log("   - GET    /api/ratings/users/:userId/rating (protected)");
    console.log("   - GET    /api/ratings/my-reviews (protected)");
    console.log("   - GET    /api/ratings/notifications (protected)");
    console.log("   - PUT    /api/ratings/notifications/:id/read (protected)");
    console.log(
      "   - PUT    /api/ratings/notifications/mark-all-read (protected)",
    );
    console.log("   - DELETE /api/ratings/notifications/:id (protected)");
    console.log("\n   Chat:");
    console.log("   - POST   /api/chat/conversations (protected)");
    console.log("   - GET    /api/chat/conversations/:id (protected)");
    console.log("   - GET    /api/chat/conversations (protected)");
    console.log(
      "   - POST   /api/chat/conversations/:conversation_id/messages (protected)",
    );
    console.log(
      "   - GET    /api/chat/conversations/:conversation_id/messages (protected)",
    );
    console.log("   - GET    /api/chat/unread-count (protected)");
    console.log("\n   Other:");
    console.log("   - GET    /api/health");
    console.log("   - GET    / (list users)");
    console.log("=".repeat(60));
  });
}

module.exports = app;
