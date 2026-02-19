import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getAllRideHistory, getDriverRideHistory, getPassengerRideHistory } from "../controller/rideHistory.controller.js";

const router = Router();

router.route("/driver").get(verifyJWT, getDriverRideHistory);
router.route("/passenger").get(verifyJWT, getPassengerRideHistory);
router.route("/all").get(verifyJWT, getAllRideHistory);

export default router;