import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

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
  const { fullName, username, email, password, bio } = req.body;

  // 2. Validate user data
  if (!fullName || !username || !email || !password) {
    throw new ApiError(400, "Please fill in all the required fields");
  }
  // validate username and make it lowercase
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    throw new ApiError(
      400,
      "Username can only contain letters, numbers, and underscores"
    );
  }

  // validate email
  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // 3. Check if user already exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  // 4. Check for avatar and cover images and upload them to cloudinary
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide an avatar image");
  }
  // Upload images to cloudinary
  const avatarUrl = await uploadOnCloudinary(
    avatarLocalPath,
    `${username}-avatar`
  );
  const coverImageUrl = await uploadOnCloudinary(
    coverImageLocalPath,
    `${username}-cover`
  );

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
  const modifiedUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!modifiedUser) {
    throw new ApiError(404, "User not Created");
  }

  // 7. Send the modified user object in the response
  return res.status(201).json(
    new ApiResponse(201, {
      message: "User created successfully",
      user: newUser,
    })
  );
});

const loginUser = asyncHandler(async (req, res) => {
  // Steps to login a user
  // 1. Get user data from frontend(req.body)
  // 2. Validate user data
  // 3. Check if user exists in the database with the provided email or username.
  // if does not exists then refirect them to /register.
  // 4. Check if password is correct
  // 5. Generate access and refresh tokens
  // 6. Send the tokens in the response secure cookie

  // 1. Get user data from frontend(req.body)
  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "Please provide an email or username");
  }
  // 2. Validate user data
  if (!password) {
    throw new ApiError(400, "Please provide a password");
  }

  // 3. Check if user exists in the database with the provided email or username. if does not exists then refirect them to /register.
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
    // Redirect to /register
  }
  // 4. Check if password is correct
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 5. Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 6. Send the tokens in the response secure cookie
  const options = {
    httpOnly: true, // The cookie is not accessible via JavaScript in the browser
    secure: true, // secure? true for https, false for http
    // sameSite: "none", // Uncomment this line if you are using the frontend and backend on different domains
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        message: "User logged in successfully",
        user: loggedInUser,
        accessToken,
        refreshToken, // Send the tokens in the response
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Steps to logout a user
  // 1. Clear the refresh token from the database
  // 2. Clear the access and refresh tokens from the cookies
  // 3. Send a response with a message

  // 1. Clear the refresh token from the database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: "",
    },
    { new: true }
  );

  // 2. Clear the access and refresh tokens from the cookies
  const options = {
    httpOnly: true,
    secure: true,
    // sameSite: "none",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {
        message: "User logged out successfully",
      })
    );
});

export { registerUser, loginUser, logoutUser };
