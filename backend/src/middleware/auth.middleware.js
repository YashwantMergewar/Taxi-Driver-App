import { User } from "./../model/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Here we are taking the access token from cookies and checking if the user is authenticated
// Here _ is used to indicate that we are not using the second parameter (res) of the function
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthrorized request ")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Unauthrorized request ")
        }
    
        req.user = user; // Attach the user to the request object
        console.log("Authenticated user:", user);
        next(); // Call the next middleware or route handler
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})