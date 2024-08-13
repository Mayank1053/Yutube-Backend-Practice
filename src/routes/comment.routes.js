import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.js";
import {getVideoComments, addComment, deleteComment, updateComment} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJwtToken); // Apply verifyJwtToken middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;