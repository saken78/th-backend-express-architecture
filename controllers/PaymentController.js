/**
 * Payment Controller
 */

const Payment = require("../models/Payment");
const Job = require("../models/Job");
const User = require("../models/User");

// ===============================
// CREATE PAYMENT
// ===============================

exports.createPayment = async (req, res) => {
  try {
    const { job_id, receiver_id, amount, payment_method } = req.body;
    const senderId = req.userId;

    // Validate required fields
    if (!job_id || !receiver_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Job ID, receiver ID, and amount are required",
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Verify that the sender is the poster of the job
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.poster_id !== senderId) {
      return res.status(403).json({
        success: false,
        message: "You can only make payments for jobs you posted",
      });
    }

    // Verify that the receiver is the accepted tasker for the job
    // This would require checking the applications table to see who was accepted
    // For now, we'll assume the receiver_id is correct

    // Check if payment already exists for this job
    const existingPayments = await Payment.findByJobId(job_id);
    if (existingPayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this job",
      });
    }

    // Process payment
    const paymentData = {
      job_id,
      sender_id: senderId,
      receiver_id,
      amount,
      payment_method: payment_method || null,
      status: 'completed' // In a real system, this would be 'pending' initially
    };

    const payment = await Payment.processPayment(job_id, senderId, receiver_id, amount);

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      payment,
    });
  } catch (error) {
    console.error("createPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment",
      error: error.message,
    });
  }
};

// ===============================
// GET PAYMENT BY ID
// ===============================

exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user is authorized to view this payment
    // Either the sender, receiver, or admin can view
    if (payment.sender_id !== userId && payment.receiver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment",
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("getPaymentById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

// ===============================
// GET PAYMENTS BY USER
// ===============================

exports.getPaymentsByUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { role = 'sender', page = 1, limit = 10 } = req.query;

    // Validate role parameter
    if (!['sender', 'receiver'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'sender' or 'receiver'",
      });
    }

    const payments = await Payment.findByUserId(userId, role);

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("getPaymentsByUser error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// ===============================
// GET PAYMENTS FOR JOB
// ===============================

exports.getPaymentsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    // Verify that user is associated with the job (either poster or tasker)
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.poster_id !== userId && job.tasker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view payments for this job",
      });
    }

    const payments = await Payment.findByJobId(jobId);

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("getPaymentsForJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments for job",
      error: error.message,
    });
  }
};

// ===============================
// REFUND PAYMENT
// ===============================

exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get the payment
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Only the sender can refund a payment (or admin)
    if (payment.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to refund this payment",
      });
    }

    // Check if payment can be refunded
    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: "Payment has already been refunded",
      });
    }

    if (payment.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: "Cannot refund a failed payment",
      });
    }

    // Process refund
    const connection = require("../config/database");
    const conn = await connection.getConnection();
    
    try {
      await conn.beginTransaction();

      // Update payment status to refunded
      await Payment.updateStatus(id, 'refunded');

      // Refund the amount to sender (if applicable)
      // In a real system, this would involve actual refund processing
      // For now, we'll just update the receiver's wallet balance back
      await conn.execute(
        `UPDATE wallets SET balance = balance - ? WHERE user_id = ?`,
        [payment.amount, payment.receiver_id]
      );

      // Create transaction record for the refund
      await conn.execute(
        `INSERT INTO transactions (wallet_id, type, amount, description, reference_id, reference_type) 
         VALUES (
           (SELECT id FROM wallets WHERE user_id = ?), 
           'debit', ?, 'Refund for payment', ?, 'refund'
         )`,
        [payment.receiver_id, payment.amount, id]
      );

      await conn.commit();

      res.json({
        success: true,
        message: "Payment refunded successfully",
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("refundPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refund payment",
      error: error.message,
    });
  }
};