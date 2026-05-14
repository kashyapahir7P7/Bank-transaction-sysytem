const accountModel = require('../models/account.model')
const userModel = require('../models/user.model')


async function createAccountController(req, res) {

    const user = req.user

    const account = await accountModel.create({
        user: user._id
    })

    res.status(201).json({
        account
    })

}

async function getAllAccountsController(req, res) {

    const accounts = await accountModel.find()

    return res.status(200).json({
        accounts
    })
}

async function getUserAccountsController(req, res) {

    try {

        const { userId } = req.params

        const accounts = await accountModel.find({
            user: userId
        })

        return res.status(200).json({
            totalAccounts: accounts.length,
            accounts
        })

    } catch (err) {

        return res.status(500).json({
            message: "Error fetching user accounts",
            error: err.message
        })

    }
}

async function createSystemAccountController(req, res) {
    try {
        const user = req.user

        // Check if user already has a system account
        const existingSystemAccount = await accountModel.findOne({
            user: user._id,
            systemUser: true
        })

        if (existingSystemAccount) {
            return res.status(400).json({
                message: "System account already exists for this user",
                account: existingSystemAccount
            })
        }

        // Create system account
        const systemAccount = await accountModel.create({
            user: user._id,
            systemUser: true,
            status: "ACTIVE"
        })

        res.status(201).json({
            message: "System account created successfully",
            account: systemAccount
        })
    } catch (err) {
        res.status(500).json({
            message: "Error creating system account",
            error: err.message
        })
    }
}

async function getAccountBalanceController(req, res) {

    try {
        const { accountId } = req.params

        const account = await accountModel.findOne({ _id: accountId, user: req.user._id })

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            })
        }

        const balance = await account.getBalance()

        res.status(200).json({
            accountId: account._id,
            balance: balance
        })
    } catch (err) {
        res.status(500).json({
            message: "Error fetching account balance",
            error: err.message
        })
    }
}

module.exports = { createAccountController, getAllAccountsController, getUserAccountsController, createSystemAccountController, getAccountBalanceController }