const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controller/account.controller")

const router = express.Router()

/**
 * POST /api/accounts/
 * create a new account 
 * Protected Route
 */

router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)


/**
 * GET /api/accounts/:userId
 * get all accounts of a specific user
 * Protected Route  
 */
router.get("/:userId", authMiddleware.authMiddleware, accountController.getUserAccountsController)

/**
 *  
 */
router.get("/", authMiddleware.authMiddleware, accountController.getAllAccountsController)

/**
 * POST /api/accounts/system
 * create a new system account 
 * Protected Route
 */

router.post("/system", authMiddleware.authMiddleware, accountController.createSystemAccountController)

/**
 * GET /api/accounts/balance/:accountId
 * get the balance of a specific account
 * Protected Route
 */

router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router