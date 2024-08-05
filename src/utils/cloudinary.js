import { v2 as cloudinary } from "cloudinary";
import FileSystem from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload an image
const uploadOnCloudinary = async (imagePath) => {
  try {
    if (!imagePath) {
      throw new Error("Please provide an image path");
    }
    await cloudinary.uploader.upload(imagePath, {
      public_id: "avatar",
    });
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url("avatar", {
      fetch_format: "auto",
      quality: "auto",
    });
    console.log(optimizeUrl);
    return optimizeUrl;
  } catch (error) {
    FileSystem.unlinkSync(imagePath);  // Delete the image from the local server as the upload is failed
    console.error(error);
  }
};



// // Transform the image: auto-crop to square aspect_ratio
// const autoCropUrl = cloudinary.url("shoes", {
//   crop: "auto",
//   gravity: "auto",
//   width: 500,
//   height: 500,
// });
// console.log(autoCropUrl);

export default uploadOnCloudinary;
