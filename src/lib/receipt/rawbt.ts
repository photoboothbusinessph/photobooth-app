// RawBT's documented rawbt:base64 transport carries ESC/POS, not PNG bytes.
export function encodeRaster(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  if (!Number.isInteger(width) || width < 8 || width > 576 || width % 8 || !Number.isInteger(height) || height < 1 || height > 1600 || rgba.length !== width * height * 4) {
    throw new Error("Invalid receipt raster dimensions.");
  }
  const stride = width / 8;
  const output = new Uint8Array(8 + stride * height);
  output.set([29, 118, 48, 0, stride & 255, stride >> 8, height & 255, height >> 8]);
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const alpha = rgba[i * 4 + 3] / 255;
    gray[i] = (rgba[i * 4] * .299 + rgba[i * 4 + 1] * .587 + rgba[i * 4 + 2] * .114) * alpha + 255 * (1 - alpha);
  }
  // Error diffusion retains photographic detail on a monochrome thermal head.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const black = gray[i] < 128;
    if (black) output[8 + y * stride + (x >> 3)] |= 128 >> (x % 8);
    const error = gray[i] - (black ? 0 : 255);
    if (x + 1 < width) gray[i + 1] += error * 7 / 16;
    if (y + 1 < height) {
      if (x > 0) gray[i + width - 1] += error * 3 / 16;
      gray[i + width] += error * 5 / 16;
      if (x + 1 < width) gray[i + width + 1] += error / 16;
    }
  }
  return output;
}

export function rawbtUri(raster: Uint8Array, copies: number): string {
  if (!Number.isInteger(copies) || copies < 1 || copies > 9) throw new Error("Choose between 1 and 9 copies.");
  // Keep below Android's IPC payload limit, including URI/UTF-16 overhead.
  if ((raster.length + 11) * copies > 220_000) throw new Error("Too many copies for one RawBT job. Reduce Copies and print another batch.");
  const job = new Uint8Array((raster.length + 11) * copies);
  for (let i = 0; i < copies; i++) {
    const offset = i * (raster.length + 11);
    job.set([27, 64, 27, 97, 1], offset);
    job.set(raster, offset + 5);
    job.set([27, 100, 3, 29, 86, 1], offset + 5 + raster.length);
  }
  // Include the cut parameter in each job (partial cut).
  const chunks: string[] = [];
  for (let i = 0; i < job.length; i += 8192) chunks.push(String.fromCharCode(...job.subarray(i, i + 8192)));
  return `rawbt:base64,${btoa(chunks.join(""))}`;
}

export async function prepareRawbtRaster(dataUrl: string, heightMm: number) {
  if (![100, 150, 200].includes(heightMm)) throw new Error("Unsupported receipt length.");
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 576; // Typical 80mm ESC/POS printable width at 203dpi.
  canvas.height = heightMm * 8;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Receipt image processing is unavailable.");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const height = image.height * canvas.width / image.width;
  context.drawImage(image, 0, (canvas.height - height) / 2, canvas.width, height);
  return encodeRaster(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
}
