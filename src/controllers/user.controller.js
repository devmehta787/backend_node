import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/users.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message:"User Registered"
    // })


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

export {registerUser}