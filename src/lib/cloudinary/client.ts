import "server-only";
import { inflateSync } from "node:zlib";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnvironment } from "@/lib/server/env";
import { overlayPixelsBySlots } from "@/lib/receipt/template-rules";

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

function paeth(a: number, b: number, c: number) {
  const prediction = a + b - c;
  const distanceA = Math.abs(prediction - a);
  const distanceB = Math.abs(prediction - b);
  const distanceC = Math.abs(prediction - c);
  return distanceA <= distanceB && distanceA <= distanceC ? a : distanceB <= distanceC ? b : c;
}

export function validateTemplateOverlay(dataUrl: string, photoSlots: number) {
  const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Image templates must be transparent PNG files.");
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Invalid PNG file.");
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (![1, 2, 3, 4].includes(photoSlots)) throw new Error("Photo slot count must be between 1 and 4.");
  const expected = overlayPixelsBySlots[photoSlots as 1 | 2 | 3 | 4];
  if (width !== expected.width || height !== expected.height) throw new Error(`This layout requires a ${expected.width}×${expected.height}px PNG.`);
  if (bitDepth !== 8 || ![4, 6].includes(colorType) || interlace !== 0) throw new Error("Use a non-interlaced 8-bit PNG with an alpha channel.");

  const chunks: Buffer[] = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === "IEND") break;
  }
  const bytesPerPixel = colorType === 6 ? 4 : 2;
  const stride = width * bytesPerPixel;
  const expectedBytes = (stride + 1) * height;
  const inflated = inflateSync(Buffer.concat(chunks), { maxOutputLength: expectedBytes });
  if (inflated.length !== expectedBytes) throw new Error("Invalid PNG pixel data.");
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let sourceOffset = 0;
  let hasTransparency = false;
  for (let row = 0; row < height; row += 1) {
    const filter = inflated[sourceOffset++];
    if (filter > 4) throw new Error("Invalid PNG row filter.");
    for (let column = 0; column < stride; column += 1) {
      const raw = inflated[sourceOffset++];
      const left = column >= bytesPerPixel ? current[column - bytesPerPixel] : 0;
      const above = previous[column];
      const upperLeft = column >= bytesPerPixel ? previous[column - bytesPerPixel] : 0;
      const predictor = filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
      current[column] = (raw + predictor) & 255;
    }
    for (let alpha = bytesPerPixel - 1; alpha < stride; alpha += bytesPerPixel) {
      if (current[alpha] < 250) { hasTransparency = true; break; }
    }
    if (hasTransparency) break;
    current.copy(previous);
  }
  if (!hasTransparency) throw new Error("The PNG must contain transparent photo windows.");
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
