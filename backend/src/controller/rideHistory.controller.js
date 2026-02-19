import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Driver } from "../model/driver.model.js";
import { RideHistory } from "../model/rideHistory.model.js";
import { Passenger } from './../model/passenger.model.js';


export const getDriverRideHistory = asyncHandler(async (req, res) => {
  if (req.user.role !== "Driver") {
    throw new ApiError(403, "Access denied");
  }

  const driver = await Driver.findOne({
    userRef: req.user._id,
  });

  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  const rides = await RideHistory.find({
    driverRef: driver._id,
  })
    .populate("passengerRef")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, {
    success: true,
    totalRides: rides.length,
    rides,
  }, "Driver ride history retrieved successfully"));
});

export const getPassengerRideHistory = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Passenger") {
      throw new ApiError(403, "Access denied");
    }
  
    const passenger = await Passenger.findOne({
      userRef: req.user._id,
    });
  
    if (!passenger) {
      throw new ApiError(404, "Passenger profile not found");
    }
  
    const rides = await RideHistory.find({
      passengerRef: passenger._id,
    })
      .populate("driverRef")
      .sort({ createdAt: -1 });
  
    res.status(200).json(new ApiResponse(200, {
      success: true,
      totalRides: rides.length,
      rides,
    }, "Passenger ride history retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve passenger ride history");
  }
});

export const getAllRideHistory = asyncHandler(async (req, res) => {
  try {
    const rides = await RideHistory.find()
      .populate("driverRef")
      .populate("passengerRef")
      .sort({ createdAt: -1 });
  
    return res.status(200).json(new ApiResponse(200, {
      success: true,
      totalRides: rides.length,
      rides,
    }, "All ride history retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve ride history");
  }
});

