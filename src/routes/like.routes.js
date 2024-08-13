import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.js";
import {
  toggleCommunityPostLike,
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();
router.use(verifyJwtToken); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/p/:postId").post(toggleCommunityPostLike);
router.route("/videos").get(getLikedVideos);

export default router;
