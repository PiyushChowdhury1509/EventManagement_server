import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export const uploadOnCloudinary = async (localFilePath: string) => {
    try{
        if(!localFilePath){
            throw new Error("file path not found");
        }

        const { url } = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        return url;

    } catch(error){
        fs.unlinkSync(localFilePath);
        throw new Error("file couldnt be uploaded on cloudinary");
    }
}