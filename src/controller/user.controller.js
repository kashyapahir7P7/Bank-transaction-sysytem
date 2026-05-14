const userModel = require("../models/user.model")

/**
 * Mark a user as a system user
 * POST /api/users/mark-system/:userId
 */
async function markUserAsSystemController(req, res) {
    try {
        const { userId } = req.params

        // Fetch user first
        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // Update systemUser field
        user.systemUser = true
        await user.save()

        // Fetch updated user with systemUser field
        const updatedUser = await userModel.findById(userId).select("+systemUser")

        res.status(200).json({
            message: "User marked as system user successfully",
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                systemUser: updatedUser.systemUser
            }
        })
    } catch(err) {
        res.status(500).json({
            message: "Error marking user as system user",
            error: err.message
        })
    }
}

/**
 * Get user details with systemUser field
 * GET /api/users/:userId
 */
async function getUserDetailsController(req, res) {
    try {
        const { userId } = req.params

        const user = await userModel.findById(userId).select("+systemUser")

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                systemUser: user.systemUser,
                createdAt: user.createdAt
            }
        })
    } catch(err) {
        res.status(500).json({
            message: "Error fetching user details",
            error: err.message
        })
    }
}

/**
 * Get current logged-in user details
 * GET /api/users/me/details
 */
async function getCurrentUserDetailsController(req, res) {
    try {
        const user = await userModel.findById(req.user._id).select("+systemUser")

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                systemUser: user.systemUser,
                createdAt: user.createdAt
            }
        })
    } catch(err) {
        res.status(500).json({
            message: "Error fetching user details",
            error: err.message
        })
    }
}

module.exports = { markUserAsSystemController, getUserDetailsController, getCurrentUserDetailsController }
