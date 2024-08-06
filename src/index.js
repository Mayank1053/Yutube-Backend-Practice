import connectDB from "./dB/db.js";
import app from "./app.js";

// What does connectDB() returns?
// connectDB() returns a promise. The promise resolves to a connection object.
// The connection object contains information about the connection to the database.
// The connection object is used to interact with the database.
// The connection object has properties and methods that allow you to perform operations on the database.
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

// Which method is better this or the one in ./src/db/db.js?
// The method in ./src/db/db.js is better because it is more modular.

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//     console.log("Database connected");
//   } catch (error) {
//     console.log("Error: ", error);
//   }
// })(); // IIFE function
