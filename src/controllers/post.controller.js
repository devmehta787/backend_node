import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/users.models.js"
import { Post } from "../models/post.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"




const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "content has to be present");
    }

    const post = await Post.create({
        content,
        owner: req.user?._id
    })
    if (!post) {
        throw new ApiError(500, "post not created")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, post, "post created successfully"))
})

const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const posts = await Post.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        }, {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        }, {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "post",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        }, {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        }, {
            $sort: {
                createdAt: -1
            }
        }, {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "Posts fetched successfully"))
})

const updatePost = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { postId } = req.params

    if (!content) {
        throw new ApiError(400, "content is required")
    }
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid postId")
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    if (post?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit thier post")
    }

    const newPost = await Post.findByIdAndUpdate(
        postId,
        {
            $set: {
                content,
            },
        }, {
            new: true
        }
    )

    if (!newPost) {
        throw new ApiError(500, "failed to edit post")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newPost, "post updated successfully"))
})

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "invalid postId")
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "post not found")
    }

    if (post?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier post")
    }

    await Post.findByIdAndDelete(postId)

    return res
        .status(200)
        .json(new ApiResponse(200, {postId}, "Post deleted successfully"))
})

export {
    createPost,
    getUserPosts,
    updatePost,
    deletePost
}