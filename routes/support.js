const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const supportController = require("../controllers/SupportController");

// POST /api/support/tickets - Create support ticket
router.post(
  "/tickets",
  verifyToken,
  supportController.createTicket
);

// GET /api/support/tickets/my-tickets - Get user's support tickets
router.get(
  "/tickets/my-tickets",
  verifyToken,
  supportController.getMyTickets
);

// GET /api/support/tickets/:id - Get support ticket by ID
router.get(
  "/tickets/:id",
  verifyToken,
  supportController.getTicket
);

// PUT /api/support/tickets/:id - Update support ticket
router.put(
  "/tickets/:id",
  verifyToken,
  supportController.updateTicket
);

// DELETE /api/support/tickets/:id - Delete support ticket
router.delete(
  "/tickets/:id",
  verifyToken,
  supportController.deleteTicket
);

module.exports = router;
