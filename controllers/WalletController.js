/**
 * Wallet Controller
 */

const User = require("../models/User");

// ===============================
// GET USER WALLET
// ===============================

exports.getUserWallet = async (req, res) => {
  try {
    const userId = req.userId;

    // Ensure wallet exists for the user
    await User.ensureWalletExists(userId);

    const wallet = await User.getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    res.json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.error("getUserWallet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet",
      error: error.message,
    });
  }
};

// ===============================
// ADD FUNDS TO WALLET
// ===============================

exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0",
      });
    }

    // In a real system, you would process the payment through a payment processor
    // Here we'll simulate the successful addition of funds

    // Update wallet balance
    const updatedWallet = await User.updateWalletBalance(userId, parseFloat(amount));

    // Create transaction record
    const connection = require("../config/database");
    const conn = await connection.getConnection();
    
    try {
      await conn.execute(
        `INSERT INTO transactions (wallet_id, type, amount, description, reference_type) 
         VALUES (
           (SELECT id FROM wallets WHERE user_id = ?), 
           'credit', ?, 'Funds added to wallet', 'deposit'
         )`,
        [userId, parseFloat(amount)]
      );
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      message: "Funds added successfully",
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("addFunds error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add funds",
      error: error.message,
    });
  }
};

// ===============================
// WITHDRAW FUNDS FROM WALLET
// ===============================

exports.withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0",
      });
    }

    // Get current wallet
    const wallet = await User.getWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Check if user has sufficient balance
    if (wallet.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // In a real system, you would process the withdrawal through a payment processor
    // Here we'll simulate the successful withdrawal

    // Update wallet balance (subtract amount)
    const updatedWallet = await User.updateWalletBalance(userId, -parseFloat(amount));

    // Create transaction record
    const connection = require("../config/database");
    const conn = await connection.getConnection();
    
    try {
      await conn.execute(
        `INSERT INTO transactions (wallet_id, type, amount, description, reference_type) 
         VALUES (
           (SELECT id FROM wallets WHERE user_id = ?), 
           'debit', ?, 'Funds withdrawn from wallet', 'withdrawal'
         )`,
        [userId, parseFloat(amount)]
      );
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      message: "Funds withdrawn successfully",
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("withdrawFunds error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to withdraw funds",
      error: error.message,
    });
  }
};

// ===============================
// GET WALLET TRANSACTIONS
// ===============================

exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.userId;

    // Get wallet ID
    const wallet = await User.getWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const connection = require("../config/database");
    const conn = await connection.getConnection();
    
    try {
      const [transactions] = await conn.execute(
        `SELECT t.*, j.title as job_title
         FROM transactions t
         LEFT JOIN payments p ON (t.reference_type = 'payment' AND t.reference_id = p.id)
         LEFT JOIN jobs j ON p.job_id = j.id
         WHERE t.wallet_id = ?
         ORDER BY t.created_at DESC`,
        [wallet.id]
      );

      res.json({
        success: true,
        transactions,
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("getWalletTransactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};