const mongoose = require("mongoose")
const { findOneAndUpdate } = require("./user.model")

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Ledger entry must be associated with an account"],
        index: true,
        immutable: true
     },
    amount: {
        type: Number,
        required: [true, "amount is required for creating a ledger entry"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Ledger entry must be associated with a transaction"],     
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: { 
            values: ["DEBIT", "CREDIT"],
            message: "Invalid ledger type"
        },
        required: [true, "Ledger entry must be either DEBIT or CREDIT"],
        immutable: true
    }
})


// midification and deletion of ledger entry is not allowed

function preventLedgerModification() {
    throw new Error("Ledger entries cannot be modified or deleted")
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndreplace", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);   
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);

const ledgerModel = mongoose.model("ledger", ledgerSchema)

module.exports = ledgerModel