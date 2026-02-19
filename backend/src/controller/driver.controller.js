import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Driver } from "../model/driver.model.js";

export const getMyDriverProfile = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Driver") {
      throw new ApiError(403, "Access denied. Not a driver.");
    }
  
    const driver = await Driver.findOne({ userRef: req.user._id });
  
    if (!driver) {
      throw new ApiError(404, "Driver profile not found");
    }
  
    return res.status(200).json(new ApiResponse(true, "Driver profile retrieved successfully", driver));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to retrieve driver profile");
  }
});

export const updateDriverStatus = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Driver") {
      throw new ApiError(403, "Access denied");
    }
  
    const { status } = req.body;
  
    const allowedStatus = ["available", "on-trip", "offline"];
  
    if (!allowedStatus.includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }
  
    const driver = await Driver.findOneAndUpdate(
      { userRef: req.user._id },
      { status },
      { new: true }
    );
  
    return res.status(200).json(new ApiResponse(true, "Status updated", driver));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to update driver status");
  }
});

export const joinQueue = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Driver") {
      throw new ApiError(403, "Only drivers can join queue");
    }
  
    const driver = await Driver.findOne({ userRef: req.user._id });
  
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }
  
    if (driver.status !== "available") {
      throw new ApiError(400, "Driver must be available to join queue");
    }
  
    if (driver.queuePosition > 0) {
      throw new ApiError(400, "Driver already in queue");
    }
  
    const lastDriver = await Driver.findOne({ status: "available" })
      .sort({ queuePosition: -1 });
  
    const newPosition = lastDriver ? lastDriver.queuePosition + 1 : 1;
  
    driver.queuePosition = newPosition;
    await driver.save();
  
    return res.status(200).json(new ApiResponse(true, "Joined queue", { queuePosition: newPosition }));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to join queue");
  }
});

export const leaveQueue = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Driver") {
      throw new ApiError(403, "Only drivers can leave queue");
    }
  
    const driver = await Driver.findOne({ userRef: req.user._id });
  
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }
  
    const oldPosition = driver.queuePosition;
  
    if (oldPosition === 0) {
      throw new ApiError(400, "Driver not in queue");
    }
  
    // Shift other drivers forward
    await Driver.updateMany(
      { queuePosition: { $gt: oldPosition } },
      { $inc: { queuePosition: -1 } }
    );
  
    driver.queuePosition = 0;
    await driver.save();
  
    return res.status(200).json(new ApiResponse(true, "Left queue", null));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to leave queue");
  }
});


export const getAvailableDrivers = asyncHandler(async (req, res) => {
  try {
    const drivers = await Driver.find({ status: "available" })
      .sort({ queuePosition: 1 });
  
    return res.status(200).json(new ApiResponse(true, "Available drivers retrieved", drivers));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to retrieve available drivers");
  }
});


