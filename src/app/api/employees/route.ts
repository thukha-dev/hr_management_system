import { NextResponse } from "next/server";
import db from "@/lib/db";
import User from "@/app/models/User";
import logger from "@/lib/logger";

// Type for the user object we'll return
type UserResponse = {
  _id: string;
  employeeId: string;
  name: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    parentContactPhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
  };
  department: string;
  position: string;
  joinDate: string;
  joinMonth: string;
  nrc: string;
  materialStatus: MaterialStatus;
  salaryProbation: number;
  salary: number;
  birthMonth: string;
  realBirthDate: string;
  nrcBirthDate: string;
  bankProvider: string;
  bankAccountNumber: string;
  contractDate: string;
  contractByName: string;
  workLocation: WorkLocation;
  profilePhoto: string;
  role: UserRole;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

const { connectDB } = db;

export async function GET() {
  try {
    await connectDB();

    // Fetch all users, excluding the password field
    const users = await User.find({})
      .select("-password") // Exclude password field
      .lean() // Convert to plain JavaScript objects
      .exec();

    // Convert MongoDB documents to response objects
    const employees = users.map((user: any): UserResponse => {
      // Create a new object with all required fields
      const response: UserResponse = {
        _id: user._id?.toString() || "",
        employeeId: user.employeeId,
        name: user.name,
        contactInfo: {
          email: user.contactInfo?.email,
          phone: user.contactInfo?.phone,
          parentContactPhone: user.contactInfo?.parentContactPhone,
          currentAddress: user.contactInfo?.currentAddress,
          permanentAddress: user.contactInfo?.permanentAddress,
        },
        department: user.department,
        position: user.position,
        joinDate: safeDateParse(user.joinDate),
        joinMonth: user.joinMonth || "",
        nrc: user.nrc || "",
        materialStatus: user.materialStatus || "Single",
        salaryProbation: user.salaryProbation || 0,
        salary: user.salary || 0,
        birthMonth: user.birthMonth || "",
        realBirthDate: safeDateParse(user.realBirthDate),
        nrcBirthDate: safeDateParse(user.nrcBirthDate),
        bankProvider: user.bankProvider || "",
        bankAccountNumber: user.bankAccountNumber || "",
        contractDate: safeDateParse(user.contractDate),
        contractByName: user.contractByName || "",
        workLocation: user.workLocation || "OFFICE",
        profilePhoto: user.profilePhoto || "",
        role: user.role || "Employee",
        status: user.status || "active",
      };

      // Add timestamps if they exist
      if (user.createdAt) {
        response.createdAt = safeDateParse(user.createdAt);
      }
      if (user.updatedAt) {
        response.updatedAt = safeDateParse(user.updatedAt);
      }

      return response;
    });

    return NextResponse.json(employees);
  } catch (error) {
    logger.error(
      `Error in GET /api/employees: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to fetch employees",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

// Helper function to safely parse dates
const safeDateParse = (dateValue: any, fallback: Date = new Date()): string => {
  try {
    if (!dateValue) return fallback.toISOString();
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
  } catch (error) {
    logger.warn("Error parsing date:", { dateValue, error });
    return fallback.toISOString();
  }
};

// Add CORS headers for API routes
export const dynamic = "force-dynamic"; // Ensure dynamic rendering

type CreateEmployeeRequest = Omit<
  UserResponse,
  "_id" | "createdAt" | "updatedAt"
> & {
  password: string;
  email: string; // Add email to the request type
  contactInfo: {
    email: string;
    phone?: string;
    parentContactPhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
  };
};

export async function POST(request: Request) {
  try {
    await connectDB();

    // Handle form data with file upload
    const formData = await request.formData();
    const dataString = formData.get("data");

    if (!dataString || typeof dataString !== "string") {
      return NextResponse.json(
        { error: "Invalid request data format" },
        { status: 400 },
      );
    }

    // const data = JSON.parse(dataString) as CreateEmployeeRequest;
    const data = JSON.parse(dataString);
    logger.info("Received data:", data);
    const file = formData.get("file") as File | null;
    let profilePhotoUrl = "";

    // Handle file upload if exists
    if (file && file.size > 0) {
      try {
        console.log("Uploading profile photo to Cloudinary...", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });

        // Upload to Cloudinary
        const { uploadImage } = await import("@/lib/cloudinary");
        profilePhotoUrl = await uploadImage(file);
        console.log(
          "Profile photo uploaded successfully to Cloudinary:",
          profilePhotoUrl,
        );
      } catch (error) {
        console.error("Error uploading profile photo to Cloudinary:", {
          error,
          errorString: String(error),
          errorStack: error instanceof Error ? error.stack : "No stack trace",
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type,
        });
        // Set a default avatar URL if upload fails
        profilePhotoUrl = "/images/default-avatar.png";
      }
    } else {
      // Set default avatar if no file is provided
      profilePhotoUrl = "/images/default-avatar.png";
    }

    // Basic validation
    if (
      !data.employeeId ||
      !data.name ||
      !data.contactInfo?.email ||
      !data.password
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (employeeId, name, email, or password)",
        },
        { status: 400 },
      );
    }

    // Check if employee with the same ID or email already exists
    const existingUser = await User.findOne({
      $or: [
        { employeeId: data.employeeId },
        { "contactInfo.email": data.contactInfo?.email },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Employee with this ID or email already exists" },
        { status: 400 },
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new user
    const newUser = new User({
      employeeId: data.employeeId,
      name: data.name,
      contactInfo: data.contactInfo || {},
      department: data.department || "",
      position: data.position || "",
      joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
      joinMonth: data.joinMonth || "",
      nrc: data.nrc || "",
      materialStatus: data.materialStatus || "Single",
      salaryProbation: data.salaryProbation || 0,
      salary: data.salary || 0,
      birthMonth: data.birthMonth || "",
      realBirthDate: data.realBirthDate ? new Date(data.realBirthDate) : null,
      nrcBirthDate: data.nrcBirthDate ? new Date(data.nrcBirthDate) : null,
      bankProvider: data.bankProvider || "",
      bankAccountNumber: data.bankAccountNumber || "",
      contractDate: data.contractDate ? new Date(data.contractDate) : null,
      contractByName: data.contractByName || "",
      workLocation: data.workLocation || "OFFICE",
      profilePhoto: profilePhotoUrl,
      role: data.role || "Employee",
      status: data.status || "active",
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Return response without password
    const { password, ...userWithoutPassword } = savedUser.toObject();

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        _id: userWithoutPassword._id?.toString(),
        joinDate: safeDateParse(userWithoutPassword.joinDate),
        realBirthDate: safeDateParse(userWithoutPassword.realBirthDate),
        nrcBirthDate: safeDateParse(userWithoutPassword.nrcBirthDate),
        contractDate: safeDateParse(userWithoutPassword.contractDate),
        createdAt: safeDateParse(userWithoutPassword.createdAt),
        updatedAt: safeDateParse(userWithoutPassword.updatedAt),
      },
    });
  } catch (error) {
    logger.error(
      `Error in POST /api/employees: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to create employee",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

// Add bcrypt for password hashing
import bcrypt from "bcryptjs";
import { MaterialStatus, UserRole, WorkLocation } from "@/types/interface";
import { promises as fs } from "fs";
import path from "path";
