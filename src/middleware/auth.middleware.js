const jwt = require("jsonwebtoken")

const userModel = require("../models/user.model")
const tokenBlacklistModel = require("../models/blackList.model")

/**
 * NORMAL AUTH MIDDLEWARE
 */

async function authMiddleware(req, res, next) {

    try {

        /**
         * GET TOKEN
         */

        const token =
            req.cookies.token ||
            req.headers.authorization?.split(" ")[1]

        /**
         * TOKEN MISSING
         */

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized access, token is missing",
                status: "FAILED"
            })
        }

        /**
         * CHECK BLACKLISTED TOKEN
         */

        const isBlacklisted = await tokenBlacklistModel.findOne({
            token
        })

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token is expired. Please login again."
            })
        }

        /**
         * VERIFY JWT TOKEN
         */

        const decoded = jwt.verify(
            token,
            process.env.JWT_TOKEN
        )

        /**
         * FETCH USER
         */

        const user = await userModel.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            })
        }

        /**
         * ATTACH USER
         */

        req.user = user

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Unauthorized access, invalid token",
            error: err.message
        })

    }
}

/**
 * SYSTEM USER AUTH MIDDLEWARE
 */

async function authSystemUserMiddleware(req, res, next) {

    try {

        /**
         * GET TOKEN
         */

        const token =
            req.cookies.token ||
            req.headers.authorization?.split(" ")[1]

        /**
         * TOKEN MISSING
         */

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized access, token is missing",
                status: "FAILED"
            })
        }

        /**
         * CHECK BLACKLIST
         */

        const isBlacklisted = await tokenBlacklistModel.findOne({
            token
        })

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token is expired. Please login again."
            })
        }

        /**
         * VERIFY TOKEN
         */

        const decoded = jwt.verify(
            token,
            process.env.JWT_TOKEN
        )

        /**
         * FETCH USER
         */

        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser")

        /**
         * USER VALIDATION
         */

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            })
        }

        /**
         * SYSTEM USER VALIDATION
         */

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, user is not a system user"
            })
        }

        /**
         * ATTACH USER
         */

        req.user = user

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Unauthorized access, invalid token",
            error: err.message
        })

    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}