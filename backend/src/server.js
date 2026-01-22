import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config(); 

const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI;


const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
