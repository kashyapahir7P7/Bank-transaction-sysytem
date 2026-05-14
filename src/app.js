const express = require("express")
const cookieParser = require("cookie-parser")

const app = express()

app.use(express.json())
app.use(cookieParser())

/**
 * Route Required
 */

const authRouter = require('./routes/auth.routes')
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const userRouter = require("./routes/user.routes")

/**
 * use Route
 */

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Backend Bank Ledger API is running",
        version: "1.0.0"
    })

})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/users", userRouter)

module.exports = app