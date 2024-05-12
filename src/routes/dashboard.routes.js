import { Router } from "express"
import {
    getChannelStats,
    getChannelVideos
} from "../middlewares/auth.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/stats").get(getChannelStats)
router.route("/videos").get(getChannelVideos)

export default router