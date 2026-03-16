import dotenv from "dotenv";
import dns from "dns";
import app from "./app.js";
import connectDB from "./src/config/index.js";
dotenv.config({
    path: "./.env"
});

// Use Google DNS for Node's resolver to fix SRV lookups on flaky networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);

connectDB().then(()=>{
    const PORT = process.env.PORT || 5000;
    // Bind to 0.0.0.0 so the server is reachable from other devices on the LAN
    app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Running on http://0.0.0.0:${PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGODB connection error:", error);
})