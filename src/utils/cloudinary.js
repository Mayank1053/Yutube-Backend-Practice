import { v2 as cloudinary } from "cloudinary";
import FileSystem from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

let path =
  "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg";

// Upload an image
const uploadOnCloudinary = async (path) => {
  try {
    if (!path) {
      throw new Error("Please provide an image path");
    }
    const result = await cloudinary.uploader.upload(path, {
      public_id: "shoes",
    });
    console.log(result);
    return result.url;
  } catch (error) {
    FileSystem.unlinkSync(path);
    console.error(error);
  }
};

// Optimize delivery by resizing and applying auto-format and auto-quality
const optimizeUrl = cloudinary.url("shoes", {
  fetch_format: "auto",
  quality: "auto",
});

console.log(optimizeUrl);

// // Transform the image: auto-crop to square aspect_ratio
// const autoCropUrl = cloudinary.url("shoes", {
//   crop: "auto",
//   gravity: "auto",
//   width: 500,
//   height: 500,
// });
// console.log(autoCropUrl);

export { uploadOnCloudinary };
