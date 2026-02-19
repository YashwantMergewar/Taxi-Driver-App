import mongoose, { Schema } from "mongoose";

const driverSchema = new Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    queuePosition: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["available", "on-trip", "offline"],
        default: "available"
    },
    vehicleName: {
        type: String,
        required: true,
        trim: true
    },
    vehicleNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    yearOfExperience: {
        type: Number,
        required: true,
        min: 0,
    },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
}, { timestamps: true })


export const Driver = mongoose.models.Driver || mongoose.model("Driver", driverSchema);