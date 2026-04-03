"use client";

const MEGABYTE = 1024 * 1024;

export const MAX_UPLOAD_BYTES = 20 * MEGABYTE;
export const MAX_IMAGE_DIMENSION = 1600;
export const JPEG_QUALITY = 0.86;
export const FILE_INPUT_ACCEPT =
  "image/*,.heic,.heif";

const ACCEPTED_IMAGE_TYPES = new Set<string>([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_TYPES = new Set<string>([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
const HEIC_EXTENSIONS = [".heic", ".heif"];

function getExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function getBaseName(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(0, index) : name;
}

function isAcceptedType(file: File): boolean {
  const fileType = file.type.toLowerCase();
  return ACCEPTED_IMAGE_TYPES.has(fileType) || ACCEPTED_EXTENSIONS.includes(getExtension(file.name));
}

function isHeicFile(file: File): boolean {
  const fileType = file.type.toLowerCase();
  return HEIC_TYPES.has(fileType) || HEIC_EXTENSIONS.includes(getExtension(file.name));
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    image.src = objectUrl;
  });
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  const heic2anyModule = await import("heic2any");
  const converted = await heic2anyModule.default({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });

  return Array.isArray(converted) ? converted[0] : converted;
}

async function renderAsJpeg(file: Blob, name: string): Promise<File> {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Image processing is unavailable in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (blob === null) {
    throw new Error("Image processing failed.");
  }

  return new File([blob], `${getBaseName(name) || "facescan-upload"}.jpg`, {
    type: "image/jpeg",
  });
}

export function validateUploadFile(file: File): string | null {
  if (!isAcceptedType(file) && !file.type.toLowerCase().startsWith("image/")) {
    return "Please upload an image file.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "Please keep each photo under 20 MB.";
  }

  return null;
}

export async function normalizeUploadFile(file: File): Promise<File> {
  const error = validateUploadFile(file);

  if (error) {
    throw new Error(error);
  }

  let source: Blob = file;

  if (isHeicFile(file)) {
    try {
      source = await convertHeicToJpeg(file);
    } catch {
      return file;
    }
  }

  try {
    const normalizedFile = await renderAsJpeg(source, file.name);
    return normalizedFile.size > MAX_UPLOAD_BYTES ? file : normalizedFile;
  } catch {
    return file;
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Base64 conversion failed"));
        return;
      }

      resolve(reader.result.replace(/^data:.*;base64,/, ""));
    };
    reader.onerror = () => reject(new Error("Base64 conversion failed"));
    reader.readAsDataURL(file);
  });
}
