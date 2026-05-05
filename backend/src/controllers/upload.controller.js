import { HttpError } from "../middleware/errorHandler.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";

export async function uploadImage(req, res) {
  const single = req.files?.image ?? [];
  const multiple = req.files?.images ?? [];
  const files = [...single, ...multiple];

  if (!files.length) {
    throw new HttpError(400, "At least one image file is required");
  }

  if (files.length > 5) {
    throw new HttpError(400, "Maximum of 5 images allowed");
  }

  const uploadResults = await Promise.all(
    files.map((file) =>
      uploadImageBuffer({
        buffer: file.buffer,
        folder: "waterwatch/uploads",
      }),
    ),
  );

  const imageUrls = uploadResults.map((item) => item.secure_url);
  const publicIds = uploadResults.map((item) => item.public_id);

  res.status(201).json({
    message: "Image upload successful",
    imageUrl: imageUrls[0],
    publicId: publicIds[0],
    imageUrls,
    publicIds,
  });
}
