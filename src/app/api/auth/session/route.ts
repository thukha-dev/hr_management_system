import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/auth";
import { getUserFromToken } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // If NextAuth session exists, use it
    if (session) {
      const { user } = session;
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      return NextResponse.json(
        { authenticated: true, user: userData },
        { status: 200 },
      );
    }

    // Fallback: try custom JWT cookie used by middleware
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    if (authToken) {
      const payload = await getUserFromToken(authToken);
      if (payload) {
        const userData = {
          id: (payload as any).userId || (payload as any).id || "",
          name: payload.name || null,
          email: null as string | null,
          role: payload.role || "user",
        };
        return NextResponse.json(
          { authenticated: true, user: userData },
          { status: 200 },
        );
      }
    }

    // No auth found
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 },
    );
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
