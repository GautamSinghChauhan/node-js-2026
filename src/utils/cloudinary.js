import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key:", process.env.CLOUDINARY_API_KEY);
// console.log("Secret:", process.env.CLOUDINARY_API_SECRET);
const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!localFilePath) return null;

        console.log("Uploading File:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image"
        });
console.log("Cloudinary Response:", response);
        console.log("Cloudinary Success:", response.secure_url);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {

        console.log("Cloudinary Failed:");
        console.log(error);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export { uploadOnCloudinary };