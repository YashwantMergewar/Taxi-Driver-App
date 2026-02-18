import 'dotenv/config';
import express from "express";
import cors from "cors";
import userRoute from "./src/routes/user.route.js"
const app = express();

if(process.env.NODE_ENV === "production"){
    app.set("trust proxy", 1);
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use("/api/v1/users", userRoute)


export default app;