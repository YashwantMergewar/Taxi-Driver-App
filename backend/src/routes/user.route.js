import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";
import { loginUser } from "../controller/user.controller.js";
import { logoutUser } from "../controller/user.controller.js";
import { getCurrentUser } from "../controller/user.controller.js";
import { verifyJWT } from './../middleware/auth.middleware.js';

const router = Router();
router.route("/register-user").post(registerUser)
router.route("/login-user").post(loginUser)
router.route("/logout-user").post(verifyJWT, logoutUser)
router.route("/me").get(verifyJWT, getCurrentUser)

export default router;