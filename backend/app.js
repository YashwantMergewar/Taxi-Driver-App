import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import userRoute from "./src/routes/user.route.js"
import bookingRoute from "./src/routes/booking.route.js"
import passengerRoute from "./src/routes/passenger.route.js"
import driverRoute from "./src/routes/driver.route.js"
import rideHistoryRoute from "./src/routes/rideHistory.route.js"
const app = express();

if(process.env.NODE_ENV === "production"){
    app.set("trust proxy", 1);
}

app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({limit: "16kb"})) // Limit the request body size to 16kb
app.use(express.urlencoded({extended: true, limit: "16kb"})) // Limit the URL-encoded data size to 16kb
app.use(express.static("public")) // Serve static files from the "public" directory
app.use(cookieParser())

app.use("/api/v1/users", userRoute)
app.use("/api/v1/bookings", bookingRoute)
app.use("/api/v1/passenger", passengerRoute)
app.use("/api/v1/driver", driverRoute)
app.use("/api/v1/ride-history", rideHistoryRoute)

// Simple healthcheck for device testing
app.get('/ping', (req, res) => res.status(200).send('pong'));



export default app;