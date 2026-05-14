const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * CREATE NORMAL TRANSACTION
 */

async function createTransaction(req, res) {

    const session = await mongoose.startSession()

    try {

        const { fromAccount, toAccount, amount, idempotencyKey } = req.body

        /**
         * 1. VALIDATE REQUEST
         */

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "fromAccount, toAccount, amount and idempotencyKey are required"
            })
        }

        /**
         * 2. VALIDATE AMOUNT
         */

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            })
        }

        /**
         * 3. PREVENT SELF TRANSFER
         */

        if (fromAccount === toAccount) {
            return res.status(400).json({
                message: "Cannot transfer money to same account"
            })
        }

        /**
         * 4. FETCH ACCOUNTS
         */

        const fromUserAccount = await accountModel.findById(fromAccount)

        const toUserAccount = await accountModel.findById(toAccount)

        if (!fromUserAccount || !toUserAccount) {
            return res.status(404).json({
                message: "Invalid fromAccount or toAccount"
            })
        }

        /**
         * 5. OWNERSHIP VALIDATION
         */

        if (fromUserAccount.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized account access"
            })
        }

        /**
         * 6. CHECK IDEMPOTENCY KEY
         */

        const existingTransaction = await transactionModel.findOne({
            idempotencyKey
        })

        if (existingTransaction) {

            if (existingTransaction.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: existingTransaction
                })
            }

            if (existingTransaction.status === "PENDING") {
                return res.status(409).json({
                    message: "Transaction is currently processing. Please try again after some time."
                })
            }

            if (
                existingTransaction.status === "FAILED" ||
                existingTransaction.status === "REVERSED"
            ) {
                return res.status(400).json({
                    message: "Previous transaction failed or reversed. Please retry with new idempotencyKey"
                })
            }
        }

        /**
         * 7. CHECK ACCOUNT STATUS
         */

        if (
            fromUserAccount.status !== "ACTIVE" ||
            toUserAccount.status !== "ACTIVE"
        ) {
            return res.status(400).json({
                message: "Both accounts must be ACTIVE"
            })
        }

        /**
         * 8. CHECK BALANCE
         */

        const balance = await fromUserAccount.getBalance()

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}`
            })
        }

        /**
         * 9. START TRANSACTION SESSION
         */

        session.startTransaction()

        /**
         * 10. CREATE TRANSACTION
         */

        const transaction = new transactionModel({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        })

        await transaction.save({ session })

        /**
         * 11. CREATE DEBIT LEDGER ENTRY
         */

        await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        /**
         * SIMULATE DELAY FOR TESTING IDEMPOTENCY
         */

        await (() => new Promise(resolve =>
            setTimeout(resolve, 100 * 1000)
        ))()

        /**
         * 12. CREATE CREDIT LEDGER ENTRY
         */

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        /**
         * 13. MARK TRANSACTION COMPLETED
         * Using findOneAndUpdate directly in DB
         */

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            {
                status: "COMPLETED"
            },
            { session }
        )

        /**
         * BENEFIT OF findOneAndUpdate
         *
         * - Direct DB update
         * - Better for concurrency
         * - Avoids stale document save issue
         * - More optimized than transaction.save()
         */

        /**
         * 14. COMMIT TRANSACTION
         */

        await session.commitTransaction()

        /**
         * 15. SEND EMAIL (NON BLOCKING)
         */

        emailService
            .sendEmail(
                req.user.email,
                req.user.name,
                amount,
                toAccount
            )
            .catch(err => console.log("Email Error:", err.message))

        /**
         * 16. RESPONSE
         */

        return res.status(201).json({
            message: "Transaction completed successfully",
            transactionId: transaction._id
        })

    } catch (err) {

        if (session.inTransaction()) {
            await session.abortTransaction()
        }

        /**
         * HANDLE CONCURRENT TRANSACTION ERRORS
         */

        if (
            err.message.includes("Please retry your operation") ||
            err.message.includes("WriteConflict") ||
            err.message.includes("NoSuchTransaction")
        ) {

            return res.status(409).json({
                message: "Transaction is currently processing. Please try again after some time."
            })
        }

        /**
         * HANDLE DUPLICATE IDEMPOTENCY KEY
         */

        if (err.code === 11000) {
            return res.status(409).json({
                message: "Transaction already in progress or completed"
            })
        }

        return res.status(500).json({
            message: "Transaction failed",
            error: err.message
        })

    } finally {

        session.endSession()

    }
}

/**
 * CREATE INITIAL FUND TRANSACTION
 */

async function createInitialFundTransaction(req, res) {

    const session = await mongoose.startSession()

    try {

        const { toAccount, amount, idempotencyKey } = req.body

        /**
         * 1. VALIDATE REQUEST
         */

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount and idempotencyKey are required"
            })
        }

        /**
         * 2. VALIDATE AMOUNT
         */

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            })
        }

        /**
         * 3. FETCH RECEIVER ACCOUNT
         */

        const toUserAccount = await accountModel.findById(toAccount)

        if (!toUserAccount) {
            return res.status(404).json({
                message: "Invalid toAccount"
            })
        }

        /**
         * 4. FETCH SYSTEM ACCOUNT
         */

        const fromUserAccount = await accountModel.findOne({
            systemUser: true,
            user: req.user._id
        })

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "System account not found"
            })
        }

        /**
         * 5. CHECK IDEMPOTENCY
         */

        const existingTransaction = await transactionModel.findOne({
            idempotencyKey
        })

        if (existingTransaction) {

            if (existingTransaction.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: existingTransaction
                })
            }

            if (existingTransaction.status === "PENDING") {
                return res.status(409).json({
                    message: "Transaction is currently processing. Please try again after some time."
                })
            }

            return res.status(400).json({
                message: "Duplicate idempotencyKey detected"
            })
        }

        /**
         * 6. START DB TRANSACTION
         */

        session.startTransaction()

        /**
         * 7. CREATE TRANSACTION
         */

        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        })

        await transaction.save({ session })

        /**
         * 8. CREATE DEBIT ENTRY
         */

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        /**
         * 9. CREATE CREDIT ENTRY
         */

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        /**
         * 10. COMPLETE TRANSACTION
         */

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            {
                status: "COMPLETED"
            },
            { session }
        )

        /**
         * 11. COMMIT TRANSACTION
         */

        await session.commitTransaction()

        /**
         * 12. RESPONSE
         */

        return res.status(201).json({
            message: "Initial fund transaction completed successfully",
            transactionId: transaction._id
        })

    } catch (err) {

        if (session.inTransaction()) {
            await session.abortTransaction()
        }

        if (
            err.message.includes("Please retry your operation") ||
            err.message.includes("WriteConflict") ||
            err.message.includes("NoSuchTransaction")
        ) {

            return res.status(409).json({
                message: "Transaction is currently processing. Please try again after some time."
            })
        }

        if (err.code === 11000) {
            return res.status(409).json({
                message: "Transaction already in progress or completed"
            })
        }

        return res.status(500).json({
            message: "Initial fund transaction failed",
            error: err.message
        })

    } finally {

        session.endSession()

    }
}

module.exports = {
    createTransaction,
    createInitialFundTransaction
}