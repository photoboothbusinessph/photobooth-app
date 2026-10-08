import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnvironment } from "@/lib/server/env";

const allowedDataUrl = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function configureCloudinary() {
  const environment = getCloudinaryEnvironment();
  cloudinary.config({
    cloud_name: environment.CLOUDINARY_CLOUD_NAME,
    api_key: environment.CLOUDINARY_API_KEY,
    api_secret: environment.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function validateImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(allowedDataUrl);
  if (!match) throw new Error("Unsupported image format.");
  const estimatedBytes = Math.floor(match[2].length * 0.75);
  if (estimatedBytes > MAX_UPLOAD_BYTES) throw new Error("Image exceeds the 8 MB upload limit.");
}

export async function uploadImage(dataUrl: string, folder: string, publicId?: string) {
  validateImageDataUrl(dataUrl);
  configureCloudinary();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `receipt-photobooth/${folder}`,
    public_id: publicId,
    overwrite: Boolean(publicId),
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
}
