import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { cancelBooking, getMyBookings, getMyPassengerProfile, updatePassengerProfile } from "../controller/passenger.controller.js";


const router = Router();

router.route("/me").get(verifyJWT, allowRoles("Passenger"), getMyPassengerProfile);

router.route("/update").patch(verifyJWT, allowRoles("Passenger"), updatePassengerProfile);

router.route("/bookings").get(verifyJWT, allowRoles("Passenger"), getMyBookings);

router.route("/booking/:id/cancel").patch(verifyJWT, allowRoles("Passenger"), cancelBooking);

export default router;
