const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({

    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "transaction must be associated with from account"],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "transaction must be associated with to account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status can be either PENDING, COMPLETED, FAILED, or REVERSED",
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "transaction amount is required"]  ,
        min: [0, "transaction amount cannot be negative"]
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required for creating a transaction"],
        index: true,
        unique: true
    }

}
, { timestamps: true })

const transactionModel = new mongoose.model("transaction", transactionSchema)

module.exports = transactionModel