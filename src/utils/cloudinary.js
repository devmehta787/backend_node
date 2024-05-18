import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { ApiError } from './ApiError';
          
cloudinary.config({ 
  cloud_name: process.env.COUDINARY_CLOUD_NAME, 
  api_key: process.env.COUDINARY_API_KEY, 
  api_secret: process.env.COUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",  
        })

        // console.log("file uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const deleteOnCloudinary = async (publicId, resource_type = "image") => {
    try {
        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type,
        })

        return response
    } catch (error) {
        new ApiError(500, error.message)
        return null
    }
}

export {uploadOnCloudinary, deleteOnCloudinary}