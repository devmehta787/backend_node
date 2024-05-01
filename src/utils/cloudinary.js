import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.COUDINARY_CLOUD_NAME, 
  api_key: COUDINARY_API_KEY, 
  api_secret: COUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",  
        })

        console.log("file uploaded on cloudinary ", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}