import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// getVideoComments, addComments, updateComment, deleteComment endpoints

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;
  const parsedLimit = parseInt(limit, 10) || 10;
  const parsedPage = parseInt(page, 10) || 1;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Determine the sorting criteria
  let sortCriteria;
  switch (sortBy) {
    case "MostLiked":
      sortCriteria = { likes: -1 };
      break;
    case "OldestFirst":
      sortCriteria = { createdAt: 1 };
      break;
    case "NewestFirst":
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  // Fetch comments with likes from videos, comments and tweets
  const comments = await Comment.aggregate([
    { $match: { video: mongoose.Types.ObjectId.createFromHexString(videoId) } },
    // Sort by createdAt in descending order
    { $sort: sortCriteria },
    // Skip the first (page - 1) * limit comments
    { $skip: (parsedPage - 1) * parsedLimit },
    // Limit the number of comments to the limit
    { $limit: parsedLimit }, // Use parsedLimit here
    // Lookup the user who wrote the comment
    {
      $lookup: {
        from: "users",
        localField: "writer",
        foreignField: "_id",
        as: "writer",
      },
    },
    // Unwind the writer array
    { $unwind: "$writer" },
    // Lookup the likes on the comment
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$comment", "$$commentId"] } } },
          { $count: "likes" },
        ],
        as: "likes",
      },
    },
    // Unwind the likes array
    { $unwind: { path: "$likes", preserveNullAndEmptyArrays: true } },
    // Project the fields to return
    {
      $project: {
        _id: 1,
        content: 1,
        writer: {
          _id: 1,
          username: 1,
          profilePicture: 1,
        },
        likes: { $ifNull: ["$likes.likes", 0] },
        createdAt: 1,
      },
    },
  ]);

  const totalDocs = await Comment.countDocuments({ video: videoId });

  if (!comments) {
    throw new ApiError(404, "No comments found");
  }

  const totalPages = Math.ceil(totalDocs / parsedLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: comments,
        totalDocs,
        limit: parsedLimit,
        page: parsedPage,
        totalPages,
        pagingCounter: (parsedPage - 1) * parsedLimit + 1,
        hasPrevPage: parsedPage > 1,
        hasNextPage: parsedPage < totalPages,
        prevPage: parsedPage > 1 ? parsedPage - 1 : null,
        nextPage: parsedPage < totalPages ? parsedPage + 1 : null,
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const { _id: writer } = req.user;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.create({
    video: videoId,
    content,
    writer,
  });

  // Add commentId to the comments field of video model
  await Video.findByIdAndUpdate(videoId, {
    $push: { comments: comment._id },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const { _id: writer } = req.user;

  if (!isObjectIdOrHexString(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.writer.toString() !== writer) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Failed to update comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedComment }, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id: writer } = req.user;

  // Find the comment and check if it exists and if the user is authorized to delete it
  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    writer: writer,
  });

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you are not authorized to delete this comment"
    );
  }

  // Remove the commentId from comments in the video model
  await Video.findByIdAndUpdate(comment.video, {
    $pull: { comments: comment._id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
