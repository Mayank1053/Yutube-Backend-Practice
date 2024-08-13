import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.js";
import {createCommunityPost, deleteCommunityPost, getUserCommunityPosts, updateCommunityPost} from "../controllers/community.controller.js";

const router = Router();
router.use(verifyJwtToken);

router.route("/").post(createCommunityPost);
router.route("/user/:userId").get(getUserCommunityPosts);
router.route("/:postId").patch(updateCommunityPost).delete(deleteCommunityPost);

export default router;
