// import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  // Steps to create playlist
  // 1. Get name and description from the frontend(req.body)
  // 2. Create & save a new playlist with the name and description
  // 3. Send the response back to the frontend

  // 1. Get name and description from the frontend(req.body)
  const { name, description } = req.body;

  // 2. Create a new playlist with the name and description
  const playlist = await Playlist.create({
    name,
    description,
    creator: req.user._id,
    videos: [],
  });

  // 3. Send the response back to the frontend
  res
    .status(201)
    .json(new ApiResponse(201, { playlist }, "New Playlist Created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  // Steps to get User playlists
  // 1. Get the userId from the request params
  // 2. Find all the playlists created by the user
  // 3. Send the response back to the frontend

  // 1. Get the userId from the request params
  const { userId } = req.params;

  // 2. Find all the playlists created by the user
  const playlists = await Playlist.find({ creator: userId });

  // 3. Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, { playlists }, "User Playlists"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  // Steps to get playlist by id
  // 1. Get the playlistId from the request params
  // 2. Find the playlist by id
  // 3. Send the response back to the frontend

  // 1. Get the playlistId from the request params
  const { playlistId } = req.params;

  // 2. Find the playlist by id
  const playlist = await Playlist.findById(playlistId);

  // 3. Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, { playlist }, "Playlist Details"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  // Steps to add video to playlist
  // 1. Get the playlistId and videoId from the request params
  // 2. Find the playlist by id
  // 3. Check if the video is already in the playlist
  // 4. If the video is not in the playlist, add the video to the playlist
  // 5. Send the response back to the frontend

  // 1. Get the playlistId and videoId from the request params
  const { playlistId, videoId } = req.params;

  // 2. Find the playlist by id
  const playlist = await Playlist.findById(playlistId);

  // Check if the playlist exists
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Check if the user is the creator of the playlist
  if (playlist.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to remove videos from this playlist"
    );
  }

  // 3. Check if the video is already in the playlist
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already in playlist");
  }

  // 4. If the video is not in the playlist, add the video to the playlist
  playlist.videos.push(videoId);
  await playlist.save();

  // 5. Send the response back to the frontend
  res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // Steps to remove video from playlist
  // 1. Get the playlistId and videoId from the request params
  // 2. Find the playlist by id
  // 3. Remove the video from the playlist
  // 4. Send the response back to the frontend

  // 1. Get the playlistId and videoId from the request params
  const { playlistId, videoId } = req.params;

  // 2. Find the playlist by id
  const playlist = await Playlist.findById(playlistId);

  // Check if the playlist exists
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Check if the user is the creator of the playlist
  if (playlist.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to remove videos from this playlist");
  }

  // 3. Remove the video from the playlist
  playlist.videos = playlist.videos.filter((v) => v !== videoId);
  await playlist.save();

  // 4. Send the response back to the frontend
  res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // Steps to delete playlist
  // 1. Get the playlistId from the request params
  // 2. Find the playlist by id
  // 3. Check if the user is the creator of the playlist
  // 4. Delete the playlist
  // 5. Send the response back to the frontend

  // 1. Get the playlistId from the request params
  const { playlistId } = req.params;

  // 2. Find the playlist by id
  const playlist = await Playlist.findById(playlistId);

  // Check if the playlist exists
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 3. Check if the user is the creator of the playlist
  if (playlist.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  // 4. Delete the playlist
  await Playlist.findByIdAndDelete(playlistId);

  // 5. Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, {}, "Playlist deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  // Steps to update playlist
  // 1. Get the playlistId from the request params
  // 2. Get the name and description from the request body
  // 3. Find the playlist by id
  // 4. Check if the user is the creator of the playlist
  // 5. Update the playlist with the new name and description
  // 6. Send the response back to the frontend

  // 1. Get the playlistId from the request params
  const { playlistId } = req.params;

  // 2. Get the name and description from the request body
  const { name, description } = req.body;

  // 3. Find the playlist by id
  const playlist = await Playlist.findById(playlistId);

  // Check if the playlist exists
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 4. Check if the user is the creator of the playlist
  if (playlist.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  // 5. Update the playlist with the new name and description
  playlist.name = name;
  playlist.description = description;
  await playlist.save();

  // 6. Send the response back to the frontend
  res.status(200).json(new ApiResponse(200, { playlist }, "Playlist updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
