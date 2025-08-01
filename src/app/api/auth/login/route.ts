import { NextResponse } from "next/server";
import UserModel from "@/app/models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import logger from "@/lib/logger";

interface LoginRequest {
  employeeId: string;
  password: string;
}

// Ensure a single Mongoose connection is reused across hot-reloads in dev
const globalWithMongoose = global as typeof globalThis & {
  _mongoosePromise?: Promise<typeof mongoose>;
};

const mongooseUri = process.env.MONGODB_URI as string;

if (!mongooseUri) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

async function connectMongoose() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection.asPromise();
  }

  if (globalWithMongoose._mongoosePromise) {
    return globalWithMongoose._mongoosePromise;
  }

  globalWithMongoose._mongoosePromise = mongoose.connect(mongooseUri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });

  return globalWithMongoose._mongoosePromise;
}

export async function POST(request: Request) {
  try {
    // Ensure MongoDB connection
    await connectMongoose();

    const { employeeId, password } = (await request.json()) as LoginRequest;

    if (!employeeId || !password) {
      return NextResponse.json(
        { error: "Employee ID and password are required" },
        { status: 400 },
      );
    }

    // Find user by employeeId
    const user = await UserModel.findOne({ employeeId }).select("+password");

    console.log("user --- ", user);
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Create JWT token
    const token = sign(
      {
        userId: user._id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
      },
      process.env.NEXT_AUTH_JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" },
    );

    // Set cookie
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: { 
          id: user._id, 
          employeeId: user.employeeId,
          name: user.name,
          role: user.role,
          department: user.department,
          position: user.position,
          joinDate: user.joinDate,
          email: user.email,
          phone: user.phone,
          address: user.address,
          profilePhoto: user.profilePhoto
        },
      },
      { status: 200 },
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    logger.error(
      `Login error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
