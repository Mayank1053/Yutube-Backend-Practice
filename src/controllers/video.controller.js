import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadMediaOnCloudinary, deleteMedia } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy = "updatedAt", sortType = "desc", userId } = req.query;

  // Convert page and limit to integers
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);

  // Calculate the skip value for pagination
  const skip = (pageInt - 1) * limitInt;

  // Build the match stage to filter videos based on query and userId
  const matchStage = {
    $match: {
      $and: [
        {
          $or: [
            { title: { $regex: query || "", $options: "i" } },
            { description: { $regex: query || "", $options: "i" } },
            { tags: { $regex: query || "", $options: "i" } },
          ],
        },
      ],
    },
  };

  // If userId is provided, add it to the match stage
  if (userId) {
    matchStage.$match.$and.push({ creator: mongoose.Types.ObjectId(userId) });
  }

  // Build the aggregate pipeline
  const pipeline = [
    matchStage,
    // Sort videos based on sortBy and sortType
    {
      $sort: {
        [sortBy]: sortType === "desc" ? -1 : 1,
      },
    },
    // Project the required fields
    {
      $project: {
        title: 1,
        description: 1,
        thumbFile: 1,
        views: 1,
        likes: 1,
        dislikes: 1,
        tags: 1,
        chapters: 1,
        duration: 1,
        creator: 1,
        privacy: 1,
        createdAt: 1,
      },
    },
    // Skip and limit for pagination
    { $skip: skip },
    { $limit: limitInt },
  ];

  // Execute the aggregate query with pagination
  const paginatedVideos = await Video.aggregate(pipeline);

  // Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, paginatedVideos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, tags, chapters, privacy } = req.body;

  // Get the video file and thumbnail from the request
  const videoFileLocal = req.files?.videoFile[0]?.path;
  const thumbFileLocal = req.files?.thumbnail[0]?.path;

  // Check if video file and thumbnail are present
  if (!videoFileLocal) {
    throw new Error("Video file is required");
  }
  if (!thumbFileLocal) {
    throw new Error("Thumbnail is required");
  }

  // Upload the video file to Cloudinary
  const videoFile = await uploadMediaOnCloudinary(
    videoFileLocal,
    "video",
    `video/${title}`
  );
  const videoUrl = videoFile.url;

  const newVersion = 0;

  // Upload the thumbnail to Cloudinary with the new version number
  const thumbFile = await uploadMediaOnCloudinary(
    thumbFileLocal,
    "image",
    `thumbnail/v${newVersion}/${title}`
  );
  const thumbnail = thumbFile.url;

  if (!(videoUrl && thumbnail)) {
    throw new Error("Failed to upload video or thumbnail");
  }

  // Get the creator ID from the request
  const { _id: creator } = req.user;

  // Validate and parse chapters if provided
  let parsedChapters;
  if (chapters) {
    parsedChapters = JSON.parse(chapters);
  }

  // Create the video in the database
  const video = await Video.create({
    videoUrl,
    thumbnail,
    title,
    description,
    tags,
    chapters: parsedChapters,
    privacy,
    duration: videoFile.duration,
    creator,
    thumbnailVersion: newVersion,
  });

  // Add the video to the user's videos field
  await User.findByIdAndUpdate(
    creator,
    { $push: { videos: video._id } },
    { new: true }
  );

  // Send the response back to the frontend
  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // Get videoId from request params
  const { videoId } = req.params;

  // Check if videoId is a valid ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find the video by videoId
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  // Get videoId from request params
  const { videoId } = req.params;
  
  // Get the updated video details from the request body
  const { title, description, tags, chapters, privacy = "public" } = req.body;

  console.log("Request Body: ",req.body);
  

  // Check if required fields are present
  if (!(title || description)) {
    throw new ApiError(400, "Title and description are required");
  }

  // Check if videoId is a valid ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find the video by videoId
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the user is authorized to update the video
  if (video.creator.toString() !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  // let parsedChapters;
  // if (chapters) {
  //   parsedChapters = JSON.parse(chapters);
  // }

  // Update the video details with checking if the values are empty
  video.title = title || video.title;
  video.description = description || video.description;
  video.privacy = privacy || video.privacy;
  video.tags = tags || video.tags;
  video.chapters = chapters || video.chapters;

  // Save the updated video details
  await video.save();

  // Send the response back to the frontend
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const updateThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const thumbFileLocal = req.file?.path;

  if (!thumbFileLocal) {
    throw new Error("Thumbnail is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  const currentVersion = video.thumbnailVersion || 0;
  const newVersion = currentVersion + 1;

  const thumbFile = await uploadMediaOnCloudinary(
    thumbFileLocal,
    "image",
    `thumbnail/v${newVersion}/${video.title}`
  );
  const thumbnail = thumbFile.url;

  if (!thumbnail) {
    throw new Error("Failed to upload thumbnail");
  } else {
    // Delete the old thumbnail from Cloudinary
    const publicId = `thumbnail/v${currentVersion}/${video.title}`;

    if (publicId) {
      await deleteMedia(publicId);
    }
  }

  video.thumbnail = thumbnail;
  video.thumbnailVersion = newVersion;
  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Thumbnail updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.creator.toString() !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  await deleteMedia(video.videoFile);
  await deleteMedia(video.thumbFile);
  // Delete the video from database
  await Video.findByIdAndDelete(videoId);

  // Remove the video to the user's videos field
  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { videos: videoId } },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const changePrivacyStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { privacy } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.creator.toString() !== String(req.user._id)) {
    throw new ApiError(403, "Unothorized to change privacy status of this video");
  }

  video.privacy = privacy;
  await video.save();

  res.status(200).json(new ApiResponse(200, video, "Privacy status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideoDetails,
  updateThumbnail,
  deleteVideo,
  changePrivacyStatus,
};
