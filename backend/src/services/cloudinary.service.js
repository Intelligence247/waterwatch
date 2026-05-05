import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { loadEnv } from "../config/env.js";

let configured = false;

function ensureCloudinaryConfigured() {
  if (configured) return;
  const env = loadEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export async function uploadImageBuffer({ buffer, folder }) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No upload result from Cloudinary"));
        return resolve(result);
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}
