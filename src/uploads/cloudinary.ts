import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// ✅ Configure once globally (NOT inside function)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME as string,
  api_key: process.env.CLOUD_API_KEY as string,
  api_secret: process.env.CLOUD_SECRET as string
});

// ✅ Upload function
const uploadoncloudinary = async (filepath: string): Promise<string | null> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(filepath);

    // ✅ Delete local file after upload
    fs.unlinkSync(filepath);

    return result.secure_url;

  } catch (error) {
    // ❌ Always cleanup
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

export default uploadoncloudinary;