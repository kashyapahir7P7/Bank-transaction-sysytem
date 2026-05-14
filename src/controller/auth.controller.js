const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")   
const tokenBlacklistModel = require("../models/blackList.model")

/**
 * POST /api/auth/register 
 * user register controller
 */

async function userRegisterController(req, res) {
    const { email, name, password } = req.body

    const isExist = await userModel.findOne({
        email: email
    })

    if (isExist) {
        return res.status(422).json({
            message: "User already existed with email",
            status: "Failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_TOKEN, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

    // Send registration email
    await emailService.sendRegistrationEmail(user.email, user.name)

}

/**
 * User Login Controller
 * POST /api/auth/login 
 */
async function userLoginController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({
        email: email
    }).select("+password")

    if (!user) {
        return res.status(422).json({
            message: "Invalid email and password"
        })
    }

    const IsvalidPassword = await user.comparePassword(password)

    if (!IsvalidPassword) {
        return res.status(401).json({
            message: 'Invalid email and password'
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_TOKEN, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(200).json({
        user: {
            _id: user.id,
            email: user.email,
            name: user.name
        },
        token
    })

}

/**
 * User Logout Controller
 * POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(422).json({
            message: "Unauthorized access, token is missing",
            status: "Failed"
        })
    }

    await tokenBlacklistModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}

module.exports = { userRegisterController, userLoginController, userLogoutController }