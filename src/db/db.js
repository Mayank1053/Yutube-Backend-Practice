import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    const dbInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
    console.log(`/n Database connected to ${dbInstance.connection.host}`);
  } catch (error) {
    console.log("Error: ", error);
    process.exit(1);
  }
};