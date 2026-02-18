import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./src/config/index.js";
dotenv.config({
    path: "./.env"
});


connectDB().then(()=>{
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGODB connection error:", error);
})