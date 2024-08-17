import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getChannelInfo,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJwtToken } from "../middlewares/auth.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
// Secured routes
router.route("/logout").post(verifyJwtToken, logoutUser);
router.route("/change-password").post(verifyJwtToken, changeCurrentPassword);
router.route("/me").get(verifyJwtToken, getCurrentUser);
router.route("/update-details").patch(verifyJwtToken, updateUserDetails);
router
  .route("/update-avatar")
  .patch(verifyJwtToken, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-image")
  .patch(verifyJwtToken, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(verifyJwtToken, getChannelInfo);
router.route("/watch-history").get(verifyJwtToken, getWatchHistory);

export default router;
