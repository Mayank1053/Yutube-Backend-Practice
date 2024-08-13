import { v2 as cloudinary } from "cloudinary";
import FileSystem from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload media (image or video)
const uploadMediaOnCloudinary = async (mediaPath, resource_type, public_id) => {
  try {
    if (!mediaPath) {
      throw new Error("Please provide a media path");
    }
    const media = await cloudinary.uploader.upload(mediaPath, {
      resource_type: resource_type || "auto",
      public_id: public_id || null,
    });

    FileSystem.unlinkSync(mediaPath); // Delete the media from the local server after the upload
    return media;
  } catch (error) {
    FileSystem.unlinkSync(mediaPath); // Delete the media from the local server as the upload is failed
    console.error(error);
  }
};

// Delete media (image or video) using destroy
const deleteMedia = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
    console.log("Media deleted successfully");
  } catch (error) {
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

export { uploadMediaOnCloudinary, deleteMedia };
