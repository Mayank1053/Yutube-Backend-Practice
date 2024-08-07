import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

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

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Steps to refresh access token
  // 1. Get the refresh token from the cookies
  // 2. Check if the refresh token is valid
  // 3. Generate a new access token and refresh token
  // 4. Send the new access token and refresh token in the response

  // 1. Get the refresh token from the cookies
  const { refreshToken: reauthToken } = req.cookies;

  // 2. Check if the refresh token is valid
  if (!reauthToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  try {
    // 3. Generate a new access token and refresh token
    // Verify the refresh token using the refresh token secret key
    const decodedToken = jwt.verify(
      reauthToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // Find the user with the decoded token id and refresh token
    const user = await User.findById(decodedToken?._id);
    // Check if the user exists and the refresh token is the same as the one in the database
    if (!user || user.refreshToken !== reauthToken) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Generate a new access token and refresh token
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // 4. Send the new access token and refresh token in the response
    const options = {
      httpOnly: true,
      secure: true,
      // sameSite: "none",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, {
          message: "Access token refreshed successfully",
          accessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, "Unauthorized access");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Steps to change the current password
  // 1. Get the user object from the request
  // 2. Get the current password, new password, and confirm password from the request
  // 3. Check if the current password is correct
  // 4. Update the password with the new password
  // 5. Send a response with a message

  // 1. Get the user object from the request
  const user = await User.findById(req.user?._id);

  // 2. Get the current password, new password, and confirm password from the request
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 3. Check if the current password is correct
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(
      400,
      "Invalid password, please enter the correct password"
    );
  }

  // Match new password and confirm password
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  // 4. Update the password with the new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // 5. Send a response with a message
  return res.status(200).json(
    new ApiResponse(200, {
      message: "Password updated successfully",
    })
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  // Steps to reset the password
  // 1. Get the email from the request
});

const updateUserDetails = asyncHandler(async (req, res) => {
  // Steps to update user details(fullName, username, email, bio)
  // 1. Get the updated user details from the request
  // 2. Get and Update the user object from the request
  // 3. Send the updated user object in the response

  // 1. Get the updated user details from the request
  const { fullName, username, email, bio } = req.body;
  if (!fullName || !username || !email) {
    throw new ApiError(400, "Please fill in all the required fields");
  }

  // 2. Get and Update the user object from the request
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      fullName,
      username,
      email,
      bio,
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 3. Send the updated user object in the response
  return res.status(200).json(
    new ApiResponse(200, {
      message: "User updated successfully",
      user,
    })
  );
});

const updateAvatar = asyncHandler(async (req, res) => {
  // Steps to update avatar
  // 1. Get the avatar image from the request
  // 2. Upload the avatar image to cloudinary
  // 3. Update the user object with the new avatar image
  // 4. Send the updated user object in the response

  // 1. Get the avatar image from the request
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide an avatar image");
  }

  // 2. Upload the avatar image to cloudinary
  const avatarUrl = await uploadOnCloudinary(
    avatarLocalPath,
    `${req.user?.username}-avatar`
  );

  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  // 3. Update the user object with the new avatar image
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      avatar: avatarUrl,
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 4. Send the updated user object in the response
  return res.status(200).json(
    new ApiResponse(200, {
      message: "Avatar updated successfully",
      user,
    })
  );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // Steps to update cover image
  // 1. Get the cover image from the request
  // 2. Upload the cover image to cloudinary
  // 3. Update the user object with the new cover image
  // 4. Send the updated user object in the response

  // 1. Get the cover image from the request
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Please provide a cover image");
  }

  // 2. Upload the cover image to cloudinary
  const coverImageUrl = await uploadOnCloudinary(
    coverImageLocalPath,
    `${req.user?.username}-cover`
  );

  if (!coverImageUrl) {
    throw new ApiError(500, "Failed to upload cover image");
  }

  // 3. Update the user object with the new cover image
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      coverImage: coverImageUrl,
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 4. Send the updated user object in the response
  return res.status(200).json(
    new ApiResponse(200, {
      message: "Cover image updated successfully",
      user,
    })
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // Steps to get the current user
  // 1. Get the user object from the request
  // 2. Send the user object in the response

  // 1. Get the user object from the request
  const user = req.user;

  // 2. Send the user object in the response
  return res.status(200).json(
    new ApiResponse(200, {
      message: "User found",
      user,
    })
  );
});

const getChannelInfo = asyncHandler(async (req, res) => {
  // Steps to get the channel profile
  // 1. Get the username from the request params
  // 2. Finding channel details using aggregate
  // 3. Send the channel object in the response

  // 1. Get the username from the request params
  const { username } = req.params;

  if (!username?.trim) {
    throw new ApiError(400, "Please provide a username");
  }

  // 2. Finding channel details using aggregate
  const channel = await User.aggregate([
    {
      // Match the channel name with the provided username
      $match: {
        username,
      },
    },
    {
      // Lookup the subscriptions collection to get the subscribers
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      // Lookup the subscriptions collection to get the subscriptions
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriptions",
      },
    },
    {
      // Add the subscriberCount, subscriptionCount, and isSubscribed fields to the user object
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        subscriptionCount: { $size: "$subscriptions" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Project the fields to be included in the response
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        bio: 1,
        subscriberCount: 1,
        subscriptionCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // 3. Send the channel object in the response
  return res.status(200).json(
    new ApiResponse(200, {
      message: "Channel found",
      channel: channel[0],
    })
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  forgotPassword,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getCurrentUser,
  getChannelInfo,
};
