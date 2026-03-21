import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET
});
const uploadoncloudinary = async (filepath) => {
    try {
        const result = await cloudinary.uploader.upload(filepath);
        fs.unlinkSync(filepath);
        return result.secure_url;
    }
    catch (error) {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};
export default uploadoncloudinary;
//# sourceMappingURL=cloudinary.js.map