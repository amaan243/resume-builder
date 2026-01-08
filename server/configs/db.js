import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected successfully");
        });
        let mongodbUri = process.env.MONGO_URI;
        const projectDbName = "resume-builder";

        if(!mongodbUri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        if (mongodbUri.endsWith("/")) {
            mongodbUri = mongodbUri.slice(0, -1);
        }
        await mongoose.connect(`${mongodbUri}/${projectDbName}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}   

export default connectDB;