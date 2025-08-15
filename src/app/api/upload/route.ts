import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import logger from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    // Optional: basic size/type validation
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if ((file as File).size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (file.type && !allowed.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type" },
        { status: 400 },
      );
    }

    // Upload to Cloudinary
    const url = await uploadImage(file);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    logger.error("Upload API error", {
      error: error instanceof Error ? error.message : String(error),
    });

    let message = "Failed to upload image";
    if (error instanceof Error) {
      if (
        error.message.includes("cloud_name") ||
        error.message.includes("api_key") ||
        error.message.includes("api_secret")
      ) {
        message =
          "Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.";
      } else {
        message = error.message;
      }
    }

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
