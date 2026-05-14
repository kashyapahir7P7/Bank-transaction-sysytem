const mongoose = require("mongoose")

const blackListSchema = new mongoose.Schema({
    token: {
        type: String,   
        required: [true, "Token is required to blacklist"],
        unique: [ true, "Token is already blacklisted"]
    },
}, {
    timestamps: true
})

blackListSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 }) // tokens will be removed from blacklist after 3 days

const blackListModel = mongoose.model("BlackList", blackListSchema)

module.exports = blackListModel