const mongoose = require("mongoose")

const connectTodb = async () => {

    try{
        await mongoose.connect("mongodb+srv://kashyapahir03_db_user:xDT5NGuRkjhIAFzv@backend-ledger.kbkcfeh.mongodb.net/")
        console.log("Database connected")
    }
    catch(err){
        console.log("Database Error ", error.message)
        process.exit(1)
    }

}

module.exports = connectTodb