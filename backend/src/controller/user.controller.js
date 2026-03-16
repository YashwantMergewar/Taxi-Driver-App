import { asyncHandler } from "../../utils/asyncHandler.js";
import { userLoginSchema, userRegistrationSchema } from "../../validationSchema/userValidationSchema.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Driver } from "../model/driver.model.js";
import { Passenger } from "../model/passenger.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // Here we have taken access and refresh token from the user model
    // now we have to save the refresh token in the database
    // and return the access token and refresh token

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // we are not validating the user before saving the refresh token (not asking for password again)

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const validatedData = userRegistrationSchema.safeParse(req.body);

  if (!validatedData.success) {
    // console.log(validatedData.error.errors);
    throw new ApiError(400, "Validation failed", validatedData.error.errors);
  }

  const {
    username,
    fullname,
    email,
    password,
    confirmPassword,
    phone,
    role,

    vehicleName,
    vehicleNumber,
    yearOfExperience,
  } = validatedData.data;

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match");
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { username }],
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }

    const user = await User.create({
      username,
      email,
      password,
      phone,
      role,
    });
    let profile = null;

    if (role === "Driver") {
      profile = await Driver.create({
        userRef: user._id,
        fullname,
        vehicleName,
        vehicleNumber,
        yearOfExperience,
      });

      user.driverRef = profile._id;
    }

    if (role === "Passenger") {
      profile = await Passenger.create({
        userRef: user._id,
        fullname,
      });

      user.passengerRef = profile._id;
    }

    await user.save();

    const createdUser = await User.findById(user._id)
      .select("-password -refreshToken")
      .populate("driverRef")
      .populate("passengerRef");

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Unable to register voter..!");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const validatedData = userLoginSchema.safeParse(req.body);

  if (!validatedData.success) {
    throw new ApiError(400, "Validation failed", validatedData.error.errors);
  }

  const { email, username, password } = validatedData.data;

  try {
    const user = await User.findOne({
      $or: [{ email }, { username }],
    }).select("+password"); 

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    let populatedUser;

    if (user.role === "Driver") {
      populatedUser = await User.findById(user._id)
        .populate("driverRef")
        .select("-password -refreshToken");
    } else {
      populatedUser = await User.findById(user._id)
        .populate("passengerRef")
        .select("-password -refreshToken");
    }

    const isProd = process.env.NODE_ENV === "production";
    
    const option = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie("accessToken", accessToken, option);
    res.cookie("refreshToken", refreshToken, option);

    return res.status(200).json({
      success: true,
      message: `${populatedUser?.role} ${populatedUser.passengerRef?.fullname || populatedUser.driverRef?.fullname} logged in successfully`,
      user: populatedUser,
      accessToken,   // Added for Expo compatibility
      refreshToken  // Added for Expo compatibility
    });

  } catch (error) {
    throw new ApiError(500, error.message || "Unable to login user..!");
  }
});


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      //$set: {refreshToken: undefined}
      // another way to set the refresh token to null
      $unset: {
        refreshToken: 1, // 1 means true, so it will unset the refreshToken field
      },
    },
    {
      new: true, // this will return the updated user
    },
  );

  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options) // clear the access token cookie
    .clearCookie("refreshToken", options) // clear the refresh token cookie
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  let populatedUser;

  if (req.user.role === "Driver") {
    populatedUser = await User.findById(req.user._id)
      .populate("driverRef")
      .select("-password -refreshToken");
  } else {
    populatedUser = await User.findById(req.user._id)
      .populate("passengerRef")
      .select("-password -refreshToken");
  }

  return res.status(200).json(
    new ApiResponse(200, populatedUser, "User profile retrieved successfully")
  );
});

export { registerUser, loginUser, logoutUser, getCurrentUser };
