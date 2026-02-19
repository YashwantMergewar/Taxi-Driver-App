import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Booking } from "../model/booking.model.js";
import { Passenger } from "../model/passenger.model.js";


export const getMyPassengerProfile = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Passenger") {
      throw new ApiError(403, "Access denied. Not a passenger.");
    }
  
    const passenger = await Passenger.findOne({
      userRef: req.user._id,
    });
  
    if (!passenger) {
      throw new ApiError(404, "Passenger profile not found");
    }
  
    return res.status(200).json(new ApiResponse(true, "Passenger profile retrieved successfully", passenger));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to retrieve passenger profile");
  }
});


export const updatePassengerProfile = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Passenger") {
      throw new ApiError(403, "Access denied.");
    }
  
    const { fullname, phone } = req.body;
  
    const passenger = await Passenger.findOneAndUpdate(
      { userRef: req.user._id },
      { fullname, phone },
      { new: true }
    );
  
    return res.status(200).json(new ApiResponse(true, "Passenger profile updated successfully", passenger));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to update passenger profile");
  }
});

export const getMyBookings = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Passenger") {
      throw new ApiError(403, "Access denied.");
    }
  
    const passenger = await Passenger.findOne({
      userRef: req.user._id,
    });
  
    const bookings = await Booking.find({
      passengerRef: passenger._id,
    })
      .populate("driverRef")
      .sort({ createdAt: -1 });
  
    return res.status(200).json(new ApiResponse(true, "Bookings retrieved successfully", bookings));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to retrieve bookings");
  }
});


export const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const passenger = await Passenger.findOne({
      userRef: req.user._id,
    });
  
    const booking = await Booking.findOne({
      _id: req.params.id,
      passengerRef: passenger._id,
    });
  
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }
  
    if (
      booking.status === "COMPLETED" ||
      booking.status === "CANCELLED"
    ) {
      throw new ApiError(400, "Cannot cancel this booking");
    }
  
    booking.status = "CANCELLED";
    await booking.save();
  
    return res.status(200).json(new ApiResponse(true, "Booking cancelled successfully", booking));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to cancel booking");
  }
});

