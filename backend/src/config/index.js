import mongoose from "mongoose";
import { DB_Name } from "../../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log(`\nMongoDb connected !! DB Host: ${connectionInstance.connection.host} `);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

export default connectDB;