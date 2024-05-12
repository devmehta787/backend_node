import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/users.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // console.log("userId: ", userId)
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while genertaing refresh access token")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {
    

    // get user details from frontend ✔️
    const { fullName, email, username, password } = req.body
    console.log(fullName, email, username)
    

    // validation - not empty, valid email, password ✔️
    
    // if (fullName === "") {
        //     throw new ApiError(400, "fullname is required")
    // }
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
        
    
    // check if user already exists ✔️
    const existingUser = await User.findOne({ 
        $or: [{ username }, { email }]
    })
    if (existingUser) {
        throw new ApiError(409, "User already exists")
    }


    // check for images, check for avatar ✔️
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    
    
    
    // upload them to cloudinary ✔️
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }


    // create user object - create entry in DB ✔️
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url||"",
        email,
        username: username.toLowerCase(),
        password
    })
    
    
    // remove password and refresh token field from repsonse ✔️ 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    

    // check for user creation ✔️
    if (!createdUser) {
        throw new ApiError(500, "User not created")
    }

    
    // send response ✔️
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)
    if(!isPasswordvalid){
        throw new ApiError(401, "Invalid password")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // console.log("incomingRefreshToken: ", incomingRefreshToken)
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // console.log("decodedToken: ", decodedToken)
        // console.log("decodedToken._id: ", decodedToken._id)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        // console.log("user: ", user._id)
        if (incomingRefreshToken != user?.refreshToken) {
            // console.log("incomingRefreshToken: ", incomingRefreshToken)
            // console.log("user.refreshToken: ", user?.refreshToken)
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    // console.log("req.user?._id: ", req.user?._id)
    const user = await User.findById(req.user?._id)
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    // console.log("isPasswordCorrect: ", isPasswordCorrect)
    
    if (!isPasswordCorrect) {
        throw new ApiError(400, "password is incorrect")
    }

    user.password = newPassword
    // console.log("user.password: ", user.password)

    await user.save({ validateBeforeSave: false })
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }
    // console.log("req: ", fullName, email)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).lean().select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User updated successfully"))
    
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}      
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    console.log("coverImageLocalPath: ", coverImageLocalPath);
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}      
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribedTo"
            }
        }, {
            $addFields: {
                totalSubscribers: { $size: "$subscribers" },
                totalSubscribedTo: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subsciber"] },
                        then: true,
                        else: false
                    }
                }
            }
        }, {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                totalSubscribers: 1,
                totalSubscribedTo: 1,
                isSubscribed: 1
            }
        }
    ])
    console.log("Channel: ", channel);
    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, channel, "Channel profile fetched successfully"))
})
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
                
            }
        }, {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username:1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }, {
                        $addFields: {
                            owner: {
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}