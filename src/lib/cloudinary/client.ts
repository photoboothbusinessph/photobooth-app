import "server-only";
import { randomUUID } from "node:crypto";
import { inflateSync } from "node:zlib";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnvironment } from "@/lib/server/env";
import { overlayPixelsBySlots } from "@/lib/receipt/template-rules";
import { WELCOME_VIDEO_MAX_BYTES } from "@/lib/welcome-video";

export type CloudinaryResourceType = "image" | "video";

const allowedDataUrl = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export class AssetValidationError extends Error {
  override name = "AssetValidationError";
}

function invalidAsset(message: string): never {
  throw new AssetValidationError(message);
}

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
  if (!match) invalidAsset("Unsupported image format.");
  const estimatedBytes = Math.floor(match[2].length * 0.75);
  if (estimatedBytes > MAX_UPLOAD_BYTES) invalidAsset("Image exceeds the 8 MB upload limit.");
}

function paeth(a: number, b: number, c: number) {
  const prediction = a + b - c;
  const distanceA = Math.abs(prediction - a);
  const distanceB = Math.abs(prediction - b);
  const distanceC = Math.abs(prediction - c);
  return distanceA <= distanceB && distanceA <= distanceC ? a : distanceB <= distanceC ? b : c;
}

export function validateTemplateOverlay(dataUrl: string, photoSlots: number) {
  const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) invalidAsset("Image templates must be transparent PNG files.");
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length < 29 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) invalidAsset("Invalid PNG file.");
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (![1, 2, 3, 4].includes(photoSlots)) invalidAsset("Photo slot count must be between 1 and 4.");
  const expected = overlayPixelsBySlots[photoSlots as 1 | 2 | 3 | 4];
  if (width !== expected.width || height !== expected.height) invalidAsset(`This layout requires a ${expected.width}×${expected.height}px PNG.`);
  const allowedBitDepths: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
  if (!allowedBitDepths[colorType]?.includes(bitDepth) || ![0, 1].includes(interlace)) invalidAsset("The PNG uses an unsupported color format.");

  const chunks: Buffer[] = [];
  let transparencyChunk: Buffer | null = null;
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    if (offset + length + 12 > buffer.length) invalidAsset("Invalid PNG file.");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === "tRNS") transparencyChunk = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if (type === "IEND") break;
  }
  if (!chunks.length) invalidAsset("Invalid PNG pixel data.");

  if ([0, 2, 3].includes(colorType)) {
    const hasTransparentEntry = colorType === 3
      ? transparencyChunk && Array.from(transparencyChunk).some((alpha) => alpha < 250)
      : Boolean(transparencyChunk);
    if (!hasTransparentEntry) invalidAsset("The PNG must contain transparent photo windows.");
    return;
  }

  // Interlaced PNGs split pixels into Adam7 passes. They still carry a real
  // alpha channel, and the browser verifies visible transparency before upload.
  if (interlace === 1) return;

  const bytesPerSample = bitDepth / 8;
  const channels = colorType === 6 ? 4 : 2;
  const bytesPerPixel = channels * bytesPerSample;
  const stride = width * bytesPerPixel;
  const expectedBytes = (stride + 1) * height;
  let inflated: Buffer;
  try {
    inflated = inflateSync(Buffer.concat(chunks), { maxOutputLength: expectedBytes });
  } catch {
    invalidAsset("Invalid PNG pixel data.");
  }
  if (inflated.length !== expectedBytes) invalidAsset("Invalid PNG pixel data.");
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let sourceOffset = 0;
  let hasTransparency = false;
  for (let row = 0; row < height; row += 1) {
    const filter = inflated[sourceOffset++];
    if (filter > 4) invalidAsset("Invalid PNG row filter.");
    for (let column = 0; column < stride; column += 1) {
      const raw = inflated[sourceOffset++];
      const left = column >= bytesPerPixel ? current[column - bytesPerPixel] : 0;
      const above = previous[column];
      const upperLeft = column >= bytesPerPixel ? previous[column - bytesPerPixel] : 0;
      const predictor = filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
      current[column] = (raw + predictor) & 255;
    }
    const alphaOffset = (channels - 1) * bytesPerSample;
    for (let pixel = 0; pixel < width; pixel += 1) {
      const alpha = pixel * bytesPerPixel + alphaOffset;
      if (bytesPerSample === 1 ? current[alpha] < 250 : current.readUInt16BE(alpha) < 65535) { hasTransparency = true; break; }
    }
    if (hasTransparency) break;
    current.copy(previous);
  }
  if (!hasTransparency) invalidAsset("The PNG must contain transparent photo windows.");
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

export function createSignedSessionUpload(
  businessId: string,
  sessionId: string,
  variant: "color" | "black-and-white",
) {
  const environment = getCloudinaryEnvironment();
  configureCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `receipt-photobooth/${businessId}/sessions/${sessionId}`;
  const publicId = variant;
  const overwrite = "true";
  const signature = cloudinary.utils.api_sign_request(
    { folder, overwrite, public_id: publicId, timestamp },
    environment.CLOUDINARY_API_SECRET,
  );
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(environment.CLOUDINARY_CLOUD_NAME)}/image/upload`,
    apiKey: environment.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
    overwrite,
    expectedPublicId: `${folder}/${publicId}`,
  };
}

export function createSignedWelcomeVideoUpload(businessId: string) {
  const environment = getCloudinaryEnvironment();
  configureCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `receipt-photobooth/${businessId}/welcome-video`;
  const publicId = randomUUID();
  const overwrite = "false";
  const allowedFormats = "mp4";
  const signature = cloudinary.utils.api_sign_request(
    { allowed_formats: allowedFormats, folder, overwrite, public_id: publicId, timestamp },
    environment.CLOUDINARY_API_SECRET,
  );
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(environment.CLOUDINARY_CLOUD_NAME)}/video/upload`,
    apiKey: environment.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
    overwrite,
    allowedFormats,
    expectedPublicId: `${folder}/${publicId}`,
  };
}

export function getCloudinaryImageUrl(publicId: string) {
  configureCloudinary();
  return cloudinary.url(publicId, { secure: true, resource_type: "image" });
}

export async function deleteImage(publicId: string) {
  return deleteAsset(publicId, "image");
}

export async function deleteAsset(publicId: string, resourceType: CloudinaryResourceType) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: resourceType });
}

export async function verifyWelcomeVideoAsset(publicId: string, expectedUrl: string) {
  configureCloudinary();
  const asset = await cloudinary.api.resource(publicId, { resource_type: "video", type: "upload" }) as {
    bytes?: number;
    format?: string;
    public_id?: string;
    resource_type?: string;
    secure_url?: string;
  };
  if (
    asset.public_id !== publicId
    || asset.resource_type !== "video"
    || asset.format !== "mp4"
    || typeof asset.bytes !== "number"
    || asset.bytes > WELCOME_VIDEO_MAX_BYTES
    || asset.secure_url !== expectedUrl
  ) {
    throw new AssetValidationError("The welcome video could not be verified.");
  }
}
