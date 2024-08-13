import { isValidObjectId } from "mongoose";
import { CommunityPost } from "../models/community.model.js";
// import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createCommunityPost = asyncHandler(async (req, res) => {
  // Steps to create a community post
  // 1. Get the content from the request body
  // 2. Get the userId from the request user object
  // 3. Create a new community post
  // 4. Send the response back to the frontend

  // 1. Get the content from the request body
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  // 2. Get the userId from the request user object
  const { _id: writer } = req.user;

  // 3. Create a new community post
  const communityPost = await CommunityPost.create({ content, writer });

  if (!communityPost) {
    throw new ApiError(500, "Post creation failed");
  }

  // 4. Send the response back to the frontend
  res.status(201).json(new ApiResponse(201, communityPost, "Post created"));
});

const getUserCommunityPosts = asyncHandler(async (req, res) => {
  // Steps to get user community posts
  // 1. Get the userId from the request user object
  // 2. Find all the community posts of the user
  // 3. Send the response back to the frontend

  // 1. Get the userId from the request user object
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // 2. Find all the community posts of the user
  const communityPosts = await CommunityPost.find({ writer: userId });

  // 3. Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, { communityPosts }, "User posts"));
});

const updateCommunityPost = asyncHandler(async (req, res) => {
  // Steps to update a community post
  // 1. Get the postId from the request params
  // 2. Get the content from the request body
  // 3. Find the community post by postId
  // 4. Check if the user is the writer of the post
  // 5. Update the community post
  // 6. Send the response back to the frontend

  // 1. Get the postId from the request params
  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  // 2. Get the content from the request body
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  // 3. Find the community post by postId
  const communityPost = await CommunityPost.findById(postId);

  if (!communityPost) {
    throw new ApiError(404, "Post not found");
  }

  // 4. Check if the user is the writer of the post
  const { _id: writer } = req.user;

  if (communityPost.writer.toString() !== String(writer)) {
    throw new ApiError(401, "Unauthorized");
  }

  // 5. Update the community post
  const updatedPost = await CommunityPost.findByIdAndUpdate(
    postId,
    { content },
    { new: true }
  );

  // 6. Send the response back to the frontend
  res
    .status(200)
    .json(new ApiResponse(200, { updatedPost }, "Post updated successfully"));
});

const deleteCommunityPost = asyncHandler(async (req, res) => {
  // Steps to delete a community post
  // 1. Get the postId from the request params
  // 2. Find the community post by postId
  // 3. Check if the user is the writer of the post
  // 4. Delete the community post
  // 5. Send the response back to the frontend

  // 1. Get the postId from the request params
  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  // 2. Find the community post by postId
  const communityPost = await CommunityPost.findById(postId);

  if (!communityPost) {
    throw new ApiError(404, "Post not found");
  }

  // 3. Check if the user is the writer of the post
  const { _id: writer } = req.user;

  if (communityPost.writer.toString() !== String(writer)) {
    throw new ApiError(401, "Unauthorized");
  }

  // 4. Delete the community post
  await CommunityPost.findByIdAndDelete(postId);

  // 5. Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export {
  createCommunityPost,
  getUserCommunityPosts,
  updateCommunityPost,
  deleteCommunityPost,
};
