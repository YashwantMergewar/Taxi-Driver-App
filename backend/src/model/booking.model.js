import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema({
    passengerRef: {
        type: Schema.Types.ObjectId,
        ref: "Passenger",
    },
    driverRef: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
    },
    pickupLocation: {
        type: String,
        required: true
    },
    dropoffLocation: {
        type: String,
        required: true
    },
    estimatedFare: {
        type: Number,
        required: true,
        min: 0
    },
    finalFare: {
        type: Number,
        min: 0,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "confirmed", "completed", "rejected", "assigned", "cancelled"],
        default: "pending"
    },
    confirmedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true })

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);