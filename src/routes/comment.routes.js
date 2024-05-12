import { Router } from "express"
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/comment.controller.js"
import { verifyToken } from "../middleware/jwt.js"

const router = Router()

router.use(verifyToken)

router.route("/:videoId").get(getVideoComments).post(addComment)
router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router