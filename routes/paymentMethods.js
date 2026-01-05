const express = require("express");
const router = express.Router();
const paymentMethodController = require("../controllers/PaymentMethodController");
const { verifyToken } = require("../middlewares/authMiddleware");

// All routes require authentication
router.use(verifyToken);

// GET /api/payments/methods - Get all payment methods for user
router.get("/", paymentMethodController.getAllPaymentMethods);

// GET /api/payments/methods/default - Get default payment method
router.get("/default", paymentMethodController.getDefaultPaymentMethod);

// GET /api/payments/methods/:id - Get specific payment method
router.get("/:id", paymentMethodController.getPaymentMethodById);

// POST /api/payments/methods - Create new payment method
router.post("/", paymentMethodController.createPaymentMethod);

// PUT /api/payments/methods/:id - Update payment method (set as default)
router.put("/:id", paymentMethodController.updatePaymentMethod);

// DELETE /api/payments/methods/:id - Delete payment method
router.delete("/:id", paymentMethodController.deletePaymentMethod);

module.exports = router;
