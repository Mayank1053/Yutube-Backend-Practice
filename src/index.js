import { connectDB } from "./db/db.js";

connectDB();

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
