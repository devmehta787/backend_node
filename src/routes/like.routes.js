import { Router } from "express"
import {
    getLikedVideos,
    toggleCommentLike,
    togglePostLike,
    toggleVideoLike
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()
router.use(verifyJWT)

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/commentId").post(toggleCommentLike)
router.route("/toggle/p/:postId").post(togglePostLike)
router.route("/videos").get(getLikedVideos)

export default router
