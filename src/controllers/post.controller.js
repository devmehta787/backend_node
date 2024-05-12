import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/users.models.js"
import { Post } from "../models/post.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"




const createPost = asyncHandler(async (req, res) => {
    //TODO: create post
})

const getUserPosts = asyncHandler(async (req, res) => {
    // TODO: get user posts
})

const updatePost = asyncHandler(async (req, res) => {
    //TODO: update post
})

const deletePost = asyncHandler(async (req, res) => {
    //TODO: delete post
})

export {
    createPost,
    getUserPosts,
    updatePost,
    deletePost
}