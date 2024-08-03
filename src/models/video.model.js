import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

/*
The video model has the following fields:
videoFile: The URL of the video file stored in Cloudinary.
thumbFile: The URL of the thumbnail image stored in Cloudinary.
title: The title of the video.
description: The description of the video.
views: The number of views the video has.
likes: The number of likes the video has.
dislikes: The number of dislikes the video has.
tags: An array of tags associated with the video.
comments: An array of comment IDs associated with the video.
duration: The duration of the video in seconds.
uploader: The ID of the user who uploaded the video.
privacy: The privacy setting of the video (public, private, or unlisted).
timestamps: The timestamps of when the video was created and updated.
*/

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String, // Cloudinary URL
      required: true,
    },
    thumbFile: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      required: true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    duration: {
      type: Number,
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    privacy: {
      type: String,
      enum: ["public", "private", "unlisted"],
      required: true,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);