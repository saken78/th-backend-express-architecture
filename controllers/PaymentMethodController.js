/**
 * Payment Method Controller
 * CRUD for payment methods (cards, banks, etc)
 */

const PaymentMethod = require("../models/PaymentMethod");

// ===============================
// GET ALL PAYMENT METHODS
// ===============================

exports.getAllPaymentMethods = async (req, res) => {
  try {
    const userId = req.userId;

    const methods = await PaymentMethod.findByUserId(userId);

    res.json({
      success: true,
      methods: methods,
    });
  } catch (error) {
    console.error("getAllPaymentMethods error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message,
    });
  }
};

// ===============================
// GET PAYMENT METHOD BY ID
// ===============================

exports.getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const method = await PaymentMethod.findById(id, userId);

    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      method: method,
    });
  } catch (error) {
    console.error("getPaymentMethodById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment method",
      error: error.message,
    });
  }
};

// ===============================
// CREATE PAYMENT METHOD
// ===============================

exports.createPaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      type,
      card_number,
      card_holder,
      expiry_month,
      expiry_year,
      cvv,
      is_default,
    } = req.body;

    // Validate required fields
    if (!type || !card_number || !card_holder) {
      return res.status(400).json({
        success: false,
        message: "Type, card number, and card holder are required",
      });
    }

    // Validate card number format (basic check)
    if (!/^\d{13,19}$/.test(card_number.replace(/\s/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Invalid card number format",
      });
    }

    const methodId = await PaymentMethod.create(userId, {
      type,
      card_number,
      card_holder,
      expiry_month,
      expiry_year,
      cvv,
      is_default: is_default || false,
    });

    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      method_id: methodId,
    });
  } catch (error) {
    console.error("createPaymentMethod error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment method",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE PAYMENT METHOD
// ===============================

exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { is_default } = req.body;

    // Verify payment method exists and belongs to user
    const method = await PaymentMethod.findById(id, userId);
    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    // Update payment method
    await PaymentMethod.update(id, userId, { is_default });

    res.json({
      success: true,
      message: "Payment method updated successfully",
    });
  } catch (error) {
    console.error("updatePaymentMethod error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment method",
      error: error.message,
    });
  }
};

// ===============================
// DELETE PAYMENT METHOD
// ===============================

exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify payment method exists and belongs to user
    const method = await PaymentMethod.findById(id, userId);
    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    // Delete payment method
    const deletedRows = await PaymentMethod.delete(id, userId);

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to delete payment method",
      });
    }

    res.json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("deletePaymentMethod error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment method",
      error: error.message,
    });
  }
};

// ===============================
// GET DEFAULT PAYMENT METHOD
// ===============================

exports.getDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;

    const method = await PaymentMethod.getDefault(userId);

    if (!method) {
      return res.status(404).json({
        success: false,
        message: "No default payment method set",
      });
    }

    res.json({
      success: true,
      method: method,
    });
  } catch (error) {
    console.error("getDefaultPaymentMethod error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch default payment method",
      error: error.message,
    });
  }
};
