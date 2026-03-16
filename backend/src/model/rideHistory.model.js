import mongoose, { Schema } from "mongoose";

const rideHistorySchema = new Schema({
    bookingRef: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    passengerRef: {
        type: Schema.Types.ObjectId,
        ref: "Passenger",
        required: true
    },
    driverRef: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        required: true
    },
    pickupLocation: {
        type: String,
        required: true
    },
    dropoffLocation: {
        type: String,
        required: true
    },
    fareAmount: {
        type: Number,
        required: true,
        min: 0
    },
    rideDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

export const RideHistory = mongoose.models.RideHistory || mongoose.model("RideHistory", rideHistorySchema);