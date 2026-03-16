import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true,
        unique:  true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: ["Driver", "Passenger"],
        required: true
    },

    driverRef: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        default: null
    },

     passengerRef: {
      type: Schema.Types.ObjectId,
      ref: "Passenger",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: {
        type: String,
        select: false
    }

    
}, { timestamps: true })

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next;
    } catch (error) {
        console.error("Error hashing password:", error);
        next(error);
    }

});

// custom method (user defind method)
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)

}

export const User = mongoose.models.User || mongoose.model("User", userSchema)