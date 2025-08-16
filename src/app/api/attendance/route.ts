import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";
import { authOptions } from "@/auth";

// Ensure this route is not statically generated
export const dynamic = "force-dynamic";

// Helper function to handle database connection
async function ensureDbConnection() {
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// GET: Get user's attendance records
export async function GET(req: NextRequest) {
  try {
    // Get session and validate user (NextAuth)
    const session = await getServerSession(authOptions);
    let currentUserId: string | null = session?.user?.id || null;

    // Fallback: try custom JWT cookie used by middleware/login
    if (!currentUserId) {
      const cookieStore = await cookies();
      const authToken = cookieStore.get("auth_token")?.value;
      if (authToken) {
        const payload = await getUserFromToken(authToken);
        currentUserId =
          (payload as any)?.userId || (payload as any)?.id || null;
      }
    }

    if (!currentUserId) {
      console.log("No authenticated user found");
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }
    if (!currentUserId) {
      console.log("User ID not found in session");
      return NextResponse.json(
        { success: false, message: "User ID not found in session" },
        { status: 400 },
      );
    }

    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 },
      );
    }

    // Get last 30 days of attendance records
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await Attendance.find({
      userId: new Types.ObjectId(currentUserId),
      checkIn: { $gte: thirtyDaysAgo },
    })
      .sort({ checkIn: -1 })
      .lean()
      .exec();

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance records",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

// POST: Handle check-in/check-out
export async function POST(req: NextRequest) {
  try {
    // Get session and validate user (NextAuth)
    const session = await getServerSession(authOptions);
    let currentUserId: string | null = session?.user?.id || null;

    // Fallback: custom JWT cookie
    if (!currentUserId) {
      const cookieStore = await cookies();
      const authToken = cookieStore.get("auth_token")?.value;
      if (authToken) {
        const payload = await getUserFromToken(authToken);
        currentUserId =
          (payload as any)?.userId || (payload as any)?.id || null;
      }
    }

    if (!currentUserId) {
      console.log("No authenticated user found");
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    const { latitude, longitude } = await req.json();

    // Validate location data
    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, message: "Location data is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const userId = new Types.ObjectId(currentUserId);
    const now = new Date();

    // Check for existing open check-in (handle both missing and null checkOut)
    const openCheckIn = await Attendance.findOne({
      userId,
      $or: [{ checkOut: { $exists: false } }, { checkOut: null }],
    });

    // If user has an open check-in, perform check-out
    if (openCheckIn) {
      // Calculate duration in hours and minutes
      const durationMs = now.getTime() - openCheckIn.checkIn.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60),
      );
      const duration = `${durationHours}h ${durationMinutes}m`;

      // Update the open check-in with check-out time and duration
      const updated = await Attendance.findByIdAndUpdate(
        openCheckIn._id,
        {
          $set: {
            checkOut: now,
            duration,
          },
        },
        { new: true },
      );

      return NextResponse.json(
        {
          success: true,
          action: "checkout",
          checkOut: updated?.checkOut,
          duration: updated?.duration,
        },
        { status: 200 },
      );
    }

    // If no open check-in, perform check-in
    // Get location name using reverse geocoding (simplified - in production, use a proper geocoding service)
    let locationName = "Unknown Location";
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      const data = await response.json();
      locationName = data.display_name || "Unknown Location";
    } catch (error) {
      console.error("Error getting location name:", error);
    }

    // Create new check-in record
    let newCheckIn;
    try {
      newCheckIn = await Attendance.create({
        userId,
        checkIn: now,
        location: locationName,
        latitude,
        longitude,
      });
    } catch (err: any) {
      // Handle duplicate open check-in (unique index on { userId, checkOut })
      if (err && err.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You already have an open check-in. Please check out before checking in again.",
          },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json(
      {
        success: true,
        action: "checkin",
        checkIn: newCheckIn.checkIn,
        location: newCheckIn.location,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing check-in/out:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
