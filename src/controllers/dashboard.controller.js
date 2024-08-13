import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
// import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const channel = await Subscription.findOne({ creator: channelId })
    .populate("creator")
    .populate("subscriber");

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const stats = await Video.aggregate([
    {
      $match: {
        creator: mongoose.Types.ObjectId.createFromHexString(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalLikes: { $size: "$likes" },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
        totalVideos: 1,
        totalLikes: 1,
      },
    },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    creator: channelId,
  });

  const result = stats.length
    ? stats[0]
    : { totalViews: 0, totalVideos: 0, totalLikes: 0 };
  result.totalSubscribers = totalSubscribers;

  res.status(200).json(new ApiResponse(200, result));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const skip = (page - 1) * limit;

  const channelWithVideos = await Video.aggregate([
    {
      $match: {
        creator: mongoose.Types.ObjectId.createFromHexString(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
      },
    },
    {
      $unwind: "$creator",
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        views: 1,
        likes: 1,
        tags: 1,
        duration: 1,
        privacy: 1,
        createdAt: 1,
        creator: {
          _id: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
  ]);

  console.log(channelWithVideos);

  if (!channelWithVideos) {
    throw new ApiError(404, "No videos found for this channel");
  }

  const totalVideos = await Video.countDocuments({
    creator: channelId,
  });
  const totalPages = Math.ceil(totalVideos / limit);

  res.status(200).json(
    new ApiResponse(
      200,
      channelWithVideos,
      {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalVideos,
          totalPages,
        },
      },
      "Channel videos found"
    )
  );
});

export { getChannelStats, getChannelVideos };
