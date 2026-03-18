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

    const { pickupLocation, dropoffLocation, estimatedFare, distanceKm } = req.body;

    const booking = await Booking.create({
      passengerRef: passenger._id,
      pickupLocation,
      dropoffLocation,
      estimatedFare: estimatedFare ?? null,
      finalFare: null,
      distanceKm: distanceKm ?? null
    });

    // Debug log
    // eslint-disable-next-line no-console
    console.log(`createBooking: passenger=${passenger._id} booking=${booking._id} pickup=${JSON.stringify(pickupLocation)} dropoff=${JSON.stringify(dropoffLocation)}`);

    // Assign first driver
    const firstDriver = await Driver.findOne({
      status: "available",
      queuePosition: { $gt: 0 },
    }).sort({ queuePosition: 1 });

    // Debug log
    // eslint-disable-next-line no-console
    console.log(`createBooking: firstDriver=${firstDriver ? firstDriver._id : 'none'}`);

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

    // Populate references in response
    await booking.populate("passengerRef driverRef");

    // Debug log
    // eslint-disable-next-line no-console
    console.log(`createBooking: assigned driver=${firstDriver._id} to booking=${booking._id}`);

    return res
      .status(201)
      .json(
        new ApiResponse(201, booking, "Booking created and driver assigned")
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to create booking");
  }
});

export const acceptBooking = asyncHandler(async (req, res) => {
  try {
    // Debug log
    // eslint-disable-next-line no-console
    console.log(`acceptBooking: request by user=${req.user._id} bookingId=${req.params.id}`);
    const driver = await Driver.findOne({
      userRef: req.user._id,
    });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverRef: driver._id,
      status: "assigned",
    }).populate("passengerRef driverRef");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    booking.status = "confirmed";
    await booking.save();

    driver.status = "on-trip";
    driver.queuePosition = 0; // remove from queue
    await driver.save();

    // Debug log
    // eslint-disable-next-line no-console
    console.log(`acceptBooking: booking=${booking._id} confirmed driver=${driver._id}`);

    return res
      .status(200)
      .json(new ApiResponse(200, booking, "Booking accepted"));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to accept booking");
  }
});

export const rejectBooking = asyncHandler(async (req, res) => {
  try {
    // Debug log
    // eslint-disable-next-line no-console
    console.log(`rejectBooking: request by user=${req.user._id} bookingId=${req.params.id}`);
    const driver = await Driver.findOne({
      userRef: req.user._id,
    });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverRef: driver._id,
      status: "assigned",
    }).populate("passengerRef");

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
      // Debug log
      // eslint-disable-next-line no-console
      console.log(`rejectBooking: no nextDriver -> booking=${booking._id} cancelled`);
    } else {
      booking.driverRef = nextDriver._id;
      booking.status = "assigned";
      // Debug log
      // eslint-disable-next-line no-console
      console.log(`rejectBooking: reassigned booking=${booking._id} to driver=${nextDriver._id}`);
    }

    await booking.save();

    return res
      .status(200)
      .json(new ApiResponse(200, booking, "Booking rejected"));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to reject booking");
  }
});

export const completeTrip = asyncHandler(async (req, res) => {
  try {
    // Debug log
    // eslint-disable-next-line no-console
    console.log(`completeTrip: request by user=${req.user._id} bookingId=${req.params.id}`);
    const driver = await Driver.findOne({
      userRef: req.user._id,
    });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverRef: driver._id,
      status: "confirmed",
    }).populate("passengerRef driverRef");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    // Accept fareAmount from request body (actual final fare agreed upon)
    const { fareAmount } = req.body;
    const finalFareToSave = fareAmount ?? booking.estimatedFare ?? 0;

    booking.status = "completed";
    booking.finalFare = finalFareToSave;
    await booking.save();

    const rideHistory = await RideHistory.create({
      bookingRef: booking._id,
      passengerRef: booking.passengerRef,
      driverRef: booking.driverRef,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      fareAmount: finalFareToSave,
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

    // Debug log
    // eslint-disable-next-line no-console
    console.log(`completeTrip: booking=${booking._id} completed; driver=${driver._id} re-added position=${newPosition}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Trip completed and driver re-added to queue"
        ),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to complete trip");
  }
});
