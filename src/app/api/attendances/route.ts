import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/auth";
import { getUserFromToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function GET(req: NextRequest) {
  try {
    // Auth: NextAuth first, then custom auth_token
    const session = await getServerSession(authOptions);
    let currentUserId: string | null = session?.user?.id || null;
    if (!currentUserId) {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token")?.value;
      if (token) {
        const payload = await getUserFromToken(token);
        currentUserId =
          (payload as any)?.userId || (payload as any)?.id || null;
      }
    }
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : startOfMonth();
    const to = toParam ? new Date(toParam) : endOfMonth();

    // Basic validation
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid date range" },
        { status: 400 },
      );
    }

    const records = await Attendance.find({
      checkIn: { $gte: from, $lte: to },
    })
      .sort({ checkIn: -1 })
      .populate({
        path: "userId",
        model: User,
        select: "name employeeId department position",
      })
      .lean()
      .exec();

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error("Error fetching all attendances:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
