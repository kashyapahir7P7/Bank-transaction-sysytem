const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "email address is required!"],
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email address"],
        unique: [true, "Email already exists!"]
    },
    name: {
        type: String,
        required: [true, "Name is required for creating a account!"]
    },
    password: {
        type: String,
        required: [true, "Password is required!"],
        minlength: [6, "password should contain more than 6 character"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true
})

// Hash password before savings

userSchema.pre("save", async function (){

    // before saving is password is not modified
    if(!this.isModified("password")){
        return 
    }

    // password convert in hash password 
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash

    return 

})

userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password)
}

// Convert your userSchema into userModel
const userModel = mongoose.model("user", userSchema)

module.exports = userModel