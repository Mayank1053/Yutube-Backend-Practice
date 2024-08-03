import { connectDB } from "./db/db.js";
import express from "express";
const app = express();

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Failed Conncetion to MONGO DB ", error);
  });

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useFindAndModify: false,
//       useCreateIndex: true,
//     });
//     console.log("Database connected");
//   } catch (error) {
//     console.log("Error: ", error);
//   }
// })(); // IIFE function
