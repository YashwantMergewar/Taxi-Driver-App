import mongoose from "mongoose";
import { DB_Name } from "../../constant.js";

const connectDB = async () => {
    const rawUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!rawUri) {
        throw new Error("Missing MongoDB connection string. Set DATABASE_URL or MONGODB_URI in env.");
    }

    // For SRV URIs (mongodb+srv://...), append database name after the domain
    // For standard URIs, check if database name already exists in the path
    let uri = rawUri.trim();
    
    // If URI doesn't already contain a database name after the domain/port, append it
    const hasDatabase = /\/[a-zA-Z0-9_-]+(\?|$)/.test(uri);
    
    if (!hasDatabase) {
        // Remove trailing slashes if any
        uri = uri.replace(/\/+$/, "");
        // Append database name and connection options
        uri = `${uri}/${DB_Name}?retryWrites=true&w=majority`;
        // eslint-disable-next-line no-console
        console.log(`📝 Database name appended: ${DB_Name}`);
    }

    try {
        const connectionInstance = await mongoose.connect(uri);
        const dbName = connectionInstance.connection.name;
        // eslint-disable-next-line no-console
        console.log(`\n✓ MongoDb connected!`);
        // eslint-disable-next-line no-console
        console.log(`  Host: ${connectionInstance.connection.host}`);
        // eslint-disable-next-line no-console
        console.log(`  Database: ${dbName}`);
        // eslint-disable-next-line no-console
        console.log(`  Expected DB: ${DB_Name}`);
        // eslint-disable-next-line no-console
        console.log(`  URI: ${uri.substring(0, 80)}...\n`);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

export default connectDB;