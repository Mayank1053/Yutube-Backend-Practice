import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.js";
import {
  getAllVideos,
  getVideoById,
  deleteVideo,
  publishAVideo,
  changePrivacyStatus,
  updateThumbnail,
  updateVideoDetails,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

router.use(verifyJwtToken); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo);

router.route("/update/detail/:videoId").patch(updateVideoDetails);

router
  .route("/update/thumbnail/:videoId")
  .patch(upload.single("thumbnail"), updateThumbnail);

router.route("/privacy/:videoId").patch(changePrivacyStatus);

export default router;
