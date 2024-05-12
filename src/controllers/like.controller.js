import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"



const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const togglePostLike = asyncHandler(async (req, res) => {
    const {postId} = req.params
    //TODO: toggle like on post
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    togglePostLike,
    toggleVideoLike,
    getLikedVideos
}