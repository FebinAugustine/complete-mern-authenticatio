import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async function (localFilePath) {
  try {
    // if (!localFilePath) return null;
    // Verify file exists
    if (!fs.existsSync(localFilePath)) {
      console.error("File does not exist at path:", localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      quality: "auto",
      //width: 400,
    });

    console.log("Cloudinary upload successful:", {
      url: response.url,
      public_id: response.public_id,
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    //remove the locally saved file.
    console.error("Cloudinary upload error:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const deleteImageFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
      invalidate: true,
    });
    console.log("Image deleted from cloudinary");
  } catch (error) {
    return error;
    console.log("delete from cloudinary failed", error);
  }
};

const deleteVideoFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;

    //delete file from cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "video",
      invalidate: true,
    });
    console.log("delete from cloudinary");
  } catch (error) {
    return error;
    console.log("delete on cloudinary failed", error);
  }
};

export {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
};
