import mongoose, { Schema } from "mongoose";

const passengerSchema = new Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    totalRides: {
        type: Number,
        default: 0
    },
    userRef: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

export const Passenger = mongoose.models.Passenger || mongoose.model("Passenger", passengerSchema);

