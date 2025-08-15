import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import logger from "@/lib/logger";
import UserModel from "@/app/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeNrc(nrc?: string) {
  if (!nrc) return nrc;
  return String(nrc)
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\s+/g, "") // all spaces
    .toUpperCase();
}

function sanitizePayload(body: any) {
  const allowed: any = {};

  if (typeof body.employeeId === "string") allowed.employeeId = body.employeeId;
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.email === "string") allowed.email = body.email;
  if (typeof body.department === "string") allowed.department = body.department;
  if (typeof body.position === "string") allowed.position = body.position;
  if (typeof body.role === "string") allowed.role = body.role; // enum enforced by schema
  if (typeof body.workLocation === "string")
    allowed.workLocation = body.workLocation === "WFH" ? "WFH" : "OFFICE";
  if (typeof body.status === "string") allowed.status = body.status;

  if (typeof body.nrc === "string") allowed.nrc = normalizeNrc(body.nrc);

  if (typeof body.joinMonth === "string") allowed.joinMonth = body.joinMonth;
  if (typeof body.materialStatus === "string")
    allowed.materialStatus = body.materialStatus;
  if (typeof body.salaryProbation === "number")
    allowed.salaryProbation = body.salaryProbation;
  if (typeof body.salary === "number") allowed.salary = body.salary;
  if (typeof body.birthMonth === "string") allowed.birthMonth = body.birthMonth;
  if (typeof body.profilePhoto === "string")
    allowed.profilePhoto = body.profilePhoto;

  if (typeof body.bankProvider === "string")
    allowed.bankProvider = body.bankProvider;
  if (typeof body.bankAccountNumber === "string")
    allowed.bankAccountNumber = body.bankAccountNumber;

  // Dates can arrive as ISO strings
  if (body.joinDate) allowed.joinDate = new Date(body.joinDate);
  if (body.realBirthDate) allowed.realBirthDate = new Date(body.realBirthDate);
  if (body.nrcBirthDate) allowed.nrcBirthDate = new Date(body.nrcBirthDate);
  if (body.contractDate) allowed.contractDate = new Date(body.contractDate);
  if (typeof body.contractByName === "string")
    allowed.contractByName = body.contractByName;

  // Nested contactInfo
  if (body.contactInfo && typeof body.contactInfo === "object") {
    allowed.contactInfo = {} as any;
    if (typeof body.contactInfo.email === "string")
      (allowed.contactInfo as any).email = body.contactInfo.email;
    if (typeof body.contactInfo.phone === "string")
      (allowed.contactInfo as any).phone = body.contactInfo.phone;
    if (typeof body.contactInfo.parentContactPhone === "string")
      (allowed.contactInfo as any).parentContactPhone =
        body.contactInfo.parentContactPhone;
    if (typeof body.contactInfo.currentAddress === "string")
      (allowed.contactInfo as any).currentAddress =
        body.contactInfo.currentAddress;
    if (typeof body.contactInfo.permanentAddress === "string")
      (allowed.contactInfo as any).permanentAddress =
        body.contactInfo.permanentAddress;
  }

  return allowed;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid employee id" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const update = sanitizePayload(body);

    const updated = await UserModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error("Failed to update employee", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (
      error &&
      typeof error === "object" &&
      (error as any).name === "ValidationError"
    ) {
      const valErr = error as any;
      const details: Array<{ path: string; message: string }> = [];
      if (valErr.errors) {
        for (const key of Object.keys(valErr.errors)) {
          const err = valErr.errors[key];
          details.push({ path: key, message: err?.message || String(err) });
        }
      }
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: details,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update employee",
      },
      { status: 500 },
    );
  }
}
