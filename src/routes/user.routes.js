const express = require("express")
const userController = require("../controller/user.controller")
const authMiddleware = require("../middleware/auth.middleware")

const router = express.Router()

/**
 * POST /api/users/mark-system/:userId
 * Mark a user as a system user
 */
router.post("/mark-system/:userId", userController.markUserAsSystemController)

/**
 * GET /api/users/:userId
 * Get user details with systemUser field
 */
router.get("/:userId", userController.getUserDetailsController)

/** 
 * GET /api/users/me/details
 * Get current logged-in user details
 */
router.get("/me/details", authMiddleware.authMiddleware, userController.getCurrentUserDetailsController)

module.exports = router
