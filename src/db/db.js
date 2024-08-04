import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// What is connectDB()?
// connectDB() is an asynchronous function that connects to the database.
export const connectDB = async () => {
  try {
    // What does mongoose.connect() returns?
    // mongoose.connect() returns a promise. The promise resolves to a connection object.
    const dbInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
    // What are the properties of the connection object?
    // The connection object has properties that contain information about the connection.
    // The properties include host, port, name, and state.
    // The host property contains the host name of the database server.
    console.log(`/n Database connected to ${dbInstance.connection.host}`);
  } catch (error) {
    console.log("Error: ", error);
    process.exit(1);
  }
};