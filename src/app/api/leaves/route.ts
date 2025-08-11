import { NextResponse } from "next/server";
import db from "@/lib/db";
import LeaveModel from "@/app/models/Leave";
import { ILeave } from "@/app/models/Leave";
import { Types } from "mongoose";

// Type for the leave object we'll return
type LeaveResponse = {
  _id: string;
  employee: {
    _id: string;
    name: string;
    employeeId: string;
  };
  leaveType: string;
  leaveDate: string;
  halfDayTime?: string;
  reason: string;
  status: string;
  approvedBy?: {
    _id: string;
    name: string;
  };
  approvedAt?: string;
  comment?: string;
  days: number;
  createdAt: string;
  updatedAt: string;
};

const { connectDB } = db;

export async function GET() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Fetch all leaves with populated employee and approvedBy fields
    const leaves = await LeaveModel.find({})
      .populate({
        path: "employee",
        select: "name employeeId",
      })
      .populate({
        path: "approvedBy",
        select: "name",
      })
      .lean()
      .sort({ leaveDate: -1, createdAt: -1 })
      .exec();

    // Convert MongoDB documents to response objects
    const response: LeaveResponse[] = leaves.map((leave: any) => ({
      _id: leave._id.toString(),
      employee: {
        _id: leave.employee._id.toString(),
        name: leave.employee.name,
        employeeId: leave.employee.employeeId,
      },
      leaveType: leave.leaveType,
      leaveDate: leave.leaveDate.toISOString(),
      ...(leave.halfDayTime && { halfDayTime: leave.halfDayTime }),
      reason: leave.reason,
      status: leave.status,
      ...(leave.approvedBy && {
        approvedBy: {
          _id: leave.approvedBy._id.toString(),
          name: leave.approvedBy.name,
        },
      }),
      ...(leave.approvedAt && { approvedAt: leave.approvedAt.toISOString() }),
      ...(leave.comment && { comment: leave.comment }),
      days: leave.days,
      createdAt: leave.createdAt.toISOString(),
      updatedAt: leave.updatedAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/leaves:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leave requests",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

// Add CORS headers for API routes
export const dynamic = "force-dynamic"; // Ensure dynamic rendering
