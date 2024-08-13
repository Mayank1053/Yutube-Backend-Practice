import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  // 1. Get videoId from the request params
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // 2. Find the isLiked status in the database
  const { _id: likeBy } = req.user;

  // 3. Try to find and delete the like record in one operation
  const like = await Like.findOneAndDelete({
    video: videoId,
    likeBy,
  });

  // 4. If the like record does not exist, create it
  if (!like) {
    await Like.create({ video: videoId, likeBy });
  }

  // Count the total likes
  const totalLikes = await Like.countDocuments({ video: videoId });

  // Push the total likes to the likes field in video model
  await Video.findByIdAndUpdate(videoId, { likes: totalLikes });

  // 5. Send the response back to the frontend
  const message = like ? "Unliked" : "Liked";
  const statusCode = like ? 200 : 201;
  res.status(statusCode).json(new ApiResponse(statusCode, totalLikes, message));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  // 1. Get commentId from the request params
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // 2. Find the isLiked status in the database
  const { _id: likeBy } = req.user;

  // 3. Try to find and delete the like record in one operation
  const like = await Like.findOneAndDelete({
    comment: commentId,
    likeBy,
  });

  // 4. If the like record does not exist, create it
  if (!like) {
    await Like.create({ comment: commentId, likeBy });
  }

  // Count the total likes
  const totalLikes = await Like.countDocuments({ comment: commentId });

  // 5. Send the response back to the frontend
  const message = like ? "Unliked" : "Liked";
  const statusCode = like ? 200 : 201;
  res.status(statusCode).json(new ApiResponse(statusCode, totalLikes, message));
});

const toggleCommunityPostLike = asyncHandler(async (req, res) => {
  // 1. Get communityPostId from the request params
  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid community post ID");
  }

  // 2. Find the like record in the database
  const { _id: likeBy } = req.user;

  // 3. Try to find and delete the like record in one operation
  const like = await Like.findOneAndDelete({
    communityPost: postId,
    likeBy,
  });

  // 4. If the like record does not exist, create it
  if (!like) {
    await Like.create({ communityPost: postId, likeBy });
  }

  // Count the total likes
  const totalLikes = await Like.countDocuments({
    communityPost: postId,
  });

  // 5. Send the response back to the frontend
  const message = like ? "Unliked" : "Liked";
  const statusCode = like ? 200 : 201;
  res.status(statusCode).json(new ApiResponse(statusCode, totalLikes, message));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // 1. Get the user ID from the request
  const { _id: likeBy } = req.user;

  if (!isValidObjectId(likeBy)) {
    throw new ApiError(400, "Invalid user ID");
  }

  try {
    // 2. Find all the liked videos by the user
    const likedVideos = await Like.find({ likeBy }).populate("video");

    // 3. Send the response back to the frontend
    const message = likedVideos.length
      ? "Liked videos"
      : "You haven't liked any videos";
    res.status(200).json(new ApiResponse(200, likedVideos, message));
  } catch (error) {
    throw new ApiError(500, "An error occurred while fetching liked videos");
  }
});

export {
  toggleCommentLike,
  toggleCommunityPostLike,
  toggleVideoLike,
  getLikedVideos,
};
