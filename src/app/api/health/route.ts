import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // Test MongoDB connection
    await db.connectDB();
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error: unknown) {
    console.error("Health check failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
