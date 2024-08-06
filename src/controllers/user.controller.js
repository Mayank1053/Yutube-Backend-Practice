import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // Steps to register a user
  // 1. Get user data from frontend(req.body)
  // 2. Validate user data
  // 3. Check if user already exists
  // 4. Check for avatar and cover images and upload them to cloudinary
  // 5. Create and save the user object with the data
  // 6. Remove password and refresh token from responce
  // 7. Send the modified user object in the response

  // 1. Get user data from frontend(req.body)
  const { fullName, username, email, password, avatar, coverImage, bio } =
    req.body;
  console.log("email:", fullName, "username: ", username, "email: ", email);

  // 2. Validate user data
  if (!fullName || !username || !email || !password || !avatar) {
    throw new ApiError(400, "Please fill in all the required fields");
  }
  // validate email
  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // 3. Check if user already exists
  User.findOne({ $or: [{ username }, { email }] }, (err, user) => {
    if (err) {
      throw new ApiError(500, "Internal Server Error");
    }
    if (user) {
      throw new ApiError(409, "User already exists");
    }
  });

  // 4. Check for avatar and cover images and upload them to cloudinary
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide an avatar image");
  }
  // Upload images to cloudinary
  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  // 5. Create and save the user object with the data
  const newUser = await User.create({
    fullName,
    username,
    email,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl || "",
    bio,
  });
  // Check if the user is created
  // 6. Remove password and refresh token from responce
  User.findById(newUser._id, (err, user) => {
    if (err) {
      throw new ApiError(500, "Internal Server Error");
    }
    if (!user) {
      throw new ApiError(404, "User not Created");
    }
  }).select("-password -refreshToken");

  // 7. Send the modified user object in the response
  return res.status(201).json(
    new ApiResponse(201, {
      message: "User created successfully",
      user: newUser,
    })
  );
});

export default registerUser;
