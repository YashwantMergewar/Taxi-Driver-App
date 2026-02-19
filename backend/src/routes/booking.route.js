import { Router } from "express";
import { verifyJWT } from './../middleware/auth.middleware.js';
import { allowRoles } from './../middleware/role.middleware.js';
import { acceptBooking, completeTrip, createBooking, rejectBooking } from "../controller/booking.controller.js";


const router = Router();
router.route("/create").post(verifyJWT, allowRoles("Passenger"), createBooking);

router.route("/:id/accept").patch(verifyJWT, allowRoles("Driver"), acceptBooking);

router.route("/:id/reject").patch(verifyJWT, allowRoles("Driver"), rejectBooking);

router.route("/:id/complete").patch(verifyJWT, allowRoles("Driver"), completeTrip);

export default router;
