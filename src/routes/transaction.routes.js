const { Router } = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controller/transaction.controller")

const transactionRoutes = Router()

/**
 * POST /api/transactions
 * Create a new transaction 
 */
 transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);


 /**
  * - POST /api/transactions/system/intial-fund
  * - create intial fund transaction from system user
  */
 transactionRoutes.post("/system/intial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundTransaction);


module.exports = transactionRoutes