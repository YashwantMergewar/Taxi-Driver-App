import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Booking } from "../model/booking.model.js";
import { Driver } from "../model/driver.model.js";
import { Passenger } from "../model/passenger.model.js";
import { RideHistory } from "../model/rideHistory.model.js";

export const createBooking = asyncHandler(async (req, res) => {
  try {
    const passenger = await Passenger.findOne({
      userRef: req.user._id,
    });

    if (!passenger) {
      throw new ApiError(404, "Passenger profile not found");
    }

    const { pickupLocation, dropoffLocation } = req.body;

    const booking = await Booking.create({
      passengerRef: passenger._id,
      pickupLocation,
      dropoffLocation,
      estimatedFare: 3200,
      finalFare: 3000
    });

    // Assign first driver
    const firstDriver = await Driver.findOne({
      status: "available",
      queuePosition: { $gt: 0 },
    }).sort({ queuePosition: 1 });

    if (!firstDriver) {
      booking.status = "cancelled";
      await booking.save();

      return res.status(200).json({
        message: "No drivers available",
      });
    }

    booking.driverRef = firstDriver._id;
    booking.status = "assigned";
    await booking.save();

    return res
      .status(201)
      .json(
        new ApiResponse(true, "Booking created and driver assigned", booking),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to create booking");
  }
});

export const acceptBooking = asyncHandler(async (req, res) => {
  try {
    const driver = await Driver.findOne({
      userRef: req.user._id,
    });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverRef: driver._id,
      status: "assigned",
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    booking.status = "confirmed";
    await booking.save();

    driver.status = "on-trip";
    driver.queuePosition = 0; // remove from queue
    await driver.save();

    return res
      .status(200)
      .json(new ApiResponse(true, "Booking accepted", booking));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to accept booking");
  }
});

export const rejectBooking = asyncHandler(async (req, res) => {
  try {
    const driver = await Driver.findOne({
      userRef: req.user._id,
    });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverRef: driver._id,
      status: "assigned",
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    const rejectedPosition = driver.queuePosition;

    booking.status = "rejected";
    await booking.save();

    const nextDriver = await Driver.findOne({
      status: "available",
      queuePosition: { $gt: rejectedPosition },
    }).sort({ queuePosition: 1 });

    if (!nextDriver) {
      booking.status = "cancelled";
    } else {
      booking.driverRef = nextDriver._id;
      booking.status = "assigned";
    }

    await booking.save();

    return res
      .status(200)
      .json(new ApiResponse(true, "Booking rejected", booking));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to reject booking");
  }
});

export const completeTrip = asyncHandler(async (req, res) => {
  try {
    const driver = await Driver.findOne({
      userRef: req.user._id,
    });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverRef: driver._id,
      status: "confirmed",
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    booking.status = "completed";
    await booking.save();

    const rideHistory = await RideHistory.create({
      bookingRef: booking._id,
      passengerRef: booking.passengerRef,
      driverRef: booking.driverRef,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      fareAmount: booking.finalFare,
    });

    if (!rideHistory) {
      throw new ApiError(500, "Failed to create ride history");
    }

    await Booking.findByIdAndDelete(booking._id);

    const lastDriver = await Driver.findOne({
      status: "available",
    }).sort({ queuePosition: -1 });

    const newPosition = lastDriver ? lastDriver.queuePosition + 1 : 1;

    driver.status = "available";
    driver.queuePosition = newPosition;
    await driver.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          true,
          "Trip completed and driver re-added to queue",
          null,
        ),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to complete trip");
  }
});
