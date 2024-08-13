import { mongoose, isValidObjectId } from "mongoose";
// import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // Steps to toggle subscription button
  // 1. Get channelId from the request params
  // 2. Find the subscription record in the database
  // 3. If the subscription record exists, delete it
  // 4. If the subscription record does not exist, create it
  // 5. Send the response back to the frontend

  // 1. Get channelId from the request params
  const { channelId } = req.params;

  // 2. Find the subscription record in the database
  const { _id: subscriberId } = req.user;

  const subscription = await Subscription.findOne({
    subscriber: subscriberId,
    creator: channelId,
  });

  // 3. If the subscription record exists, delete it
  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);
    return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed"));
  }

  // 4. If the subscription record does not exist, create it
  await Subscription.create({ subscriber: subscriberId, creator: channelId });

  // 5. Send the response back to the frontend
  res.status(201).json(new ApiResponse(201, {}, "Subscribed"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // 1. Get channelId from the request params
  const { channelId } = req.params;

  // Check if the channelId is a valid ObjectId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Check if the user is autharized to see the subs
  const userId = String(req.user._id);

  if (userId !== channelId) {
    throw new ApiError(401, "Unauthorized");
  }

  // 2. Get page and limit from query params, with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // 3. Calculate the skip value for pagination
  const skip = (page - 1) * limit;

  // 4. Find all the subscribers of the channel with pagination
  const subscribers = await Subscription.find({ creator: channelId })
    .populate("subscriber")
    .skip(skip)
    .limit(limit);

  // 5. Send the response back to the frontend
  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  // 1. Get the channelId from the request params
  const { channelId } = req.params;

  console.log(channelId);
  

  // Check if the channelId is a valid ObjectId\
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  // 2. Get page and limit from query params, with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // 3. Calculate the skip value for pagination
  const skip = (page - 1) * limit;

  // 4. Find all the channels that the user has subscribed to with pagination
  const channels = await Subscription.find({ subscriber: channelId })
    .populate("creator")
    .skip(skip)
    .limit(limit);

  if (!channels) {
    throw new ApiError(404, "No subscribed channels found");
  }

  // 5. Send the response back to the frontend
  res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
