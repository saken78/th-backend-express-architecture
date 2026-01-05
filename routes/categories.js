const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/CategoryController");

// GET all categories (public endpoint - no auth required)
router.get("/", categoryController.getAllCategories);

// GET category by ID
router.get("/:id", categoryController.getCategoryById);

module.exports = router;
