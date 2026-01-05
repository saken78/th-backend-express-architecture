const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

const paymentController = require("../controllers/PaymentController");
const walletController = require("../controllers/WalletController");

// ===============================
// PAYMENT ENDPOINTS
// ===============================

// ===============================
// WALLET ENDPOINTS (MUST be before generic routes)
// ===============================

// GET /api/payments/wallet - Get user's wallet info
router.get(
  "/wallet",
  verifyToken,
  walletController.getUserWallet
);

// POST /api/payments/wallet/add-funds - Add funds to wallet
router.post(
  "/wallet/add-funds",
  verifyToken,
  walletController.addFunds
);

// POST /api/payments/wallet/withdraw - Withdraw funds from wallet
router.post(
  "/wallet/withdraw",
  verifyToken,
  walletController.withdrawFunds
);

// GET /api/payments/wallet/transactions - Get wallet transactions
router.get(
  "/wallet/transactions",
  verifyToken,
  walletController.getWalletTransactions
);

// ===============================
// PAYMENT ENDPOINTS
// ===============================

// POST /api/payments - Create a new payment (Poster only)
router.post(
  "/",
  verifyToken,
  checkRole('poster'), // Only posters can initiate payments
  paymentController.createPayment
);

// GET /api/payments/job/:jobId - Get payments for a specific job
router.get(
  "/job/:jobId",
  verifyToken,
  paymentController.getPaymentsForJob
);

// PUT /api/payments/:id/refund - Refund a payment (Sender only)
router.put(
  "/:id/refund",
  verifyToken,
  paymentController.refundPayment
);

// GET /api/payments/:id - Get payment by ID (Sender or Receiver)
router.get(
  "/:id",
  verifyToken,
  paymentController.getPaymentById
);

// GET /api/payments - Get payments by user (Sender or Receiver)
router.get(
  "/",
  verifyToken,
  paymentController.getPaymentsByUser
);

module.exports = router;