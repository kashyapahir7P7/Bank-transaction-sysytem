require("dotenv").config()
const express = require("express")
const cookieParser = require("cookie-parser")

const app = require("./src/app")
const connectTodb = require("./src/config/db")
const authRoutes = require("./src/routes/auth.routes")

// Database
connectTodb()

app.use(express.json())
app.use(cookieParser())

// Routes
app.use("/api/auth", authRoutes)

app.listen(3000, () => {
    console.log("server is running on port 3000")
})
