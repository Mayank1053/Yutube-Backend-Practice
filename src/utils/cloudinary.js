import { v2 as cloudinary } from "cloudinary";
import FileSystem from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload an image
const uploadOnCloudinary = async (imagePath, public_id) => {
  try {
    if (!imagePath) {
      throw new Error("Please provide an image path");
    }
    await cloudinary.uploader.upload(imagePath, {
      public_id: public_id || null,
    });
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url(public_id, {
      fetch_format: "auto",
      quality: "auto",
    });
    FileSystem.unlinkSync(imagePath);  // Delete the image from the local server after the upload
    console.log(optimizeUrl);
    return optimizeUrl;
  } catch (error) {
    FileSystem.unlinkSync(imagePath);  // Delete the image from the local server as the upload is failed
    console.error(error);
  }
};

// Delete an image using destroy
const deleteOldImage = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
    console.log("Image deleted successfully");
  } catch (error) {
    console.error(error);
  }
}



// // Transform the image: auto-crop to square aspect_ratio
// const autoCropUrl = cloudinary.url("shoes", {
//   crop: "auto",
//   gravity: "auto",
//   width: 500,
//   height: 500,
// });
// console.log(autoCropUrl);

export {uploadOnCloudinary, deleteOldImage};
