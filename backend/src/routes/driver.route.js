import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { getMyDriverProfile, joinQueue, leaveQueue, updateDriverStatus, getAvailableDrivers } from "../controller/driver.controller.js";


const router = Router();

router.route("/me").get(verifyJWT, allowRoles("Driver"), getMyDriverProfile);

router.route("/status").patch(verifyJWT, allowRoles("Driver"), updateDriverStatus);

router.route("/queue/join").post(verifyJWT, allowRoles("Driver"), joinQueue);

router.route("/queue/leave").post(verifyJWT, allowRoles("Driver"), leaveQueue);

// GET /api/v1/driver/available  (Driver only) - list drivers currently available and their queue positions
router.route("/available").get(verifyJWT, allowRoles("Driver"), getAvailableDrivers);

export default router;
