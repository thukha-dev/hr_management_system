import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { parse } from "csv-parse";
import * as XLSX from "xlsx";
import mongoose from "mongoose";
import UserModel from "@/app/models/User";
import bcrypt from "bcryptjs";
import logger from "@/lib/logger";

interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
  importedCount?: number;
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

function validateEmployeeData(
  data: any[],
  headers: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredFields = [
    "employeeId",
    "name",
    "department",
    "position",
    "joinDate",
  ];
  const validDepartments = [
    "HR",
    "Engineering",
    "Marketing",
    "Sales",
    "Finance",
    "IT",
  ];
  const validPositions = [
    "Manager",
    "Developer",
    "Designer",
    "Analyst",
    "Coordinator",
    "Director",
  ];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row

    // Check required fields
    requiredFields.forEach((field) => {
      if (!row[field] || row[field].toString().trim() === "") {
        errors.push({
          row: rowNumber,
          column: field,
          value: row[field] || "",
          message: `${field} is required`,
        });
      }
    });

    // Validate employeeId format (should be unique)
    if (row.employeeId) {
      if (!/^[A-Z]{2,3}-\d{5}$/.test(row.employeeId)) {
        errors.push({
          row: rowNumber,
          column: "employeeId",
          value: row.employeeId,
          message: "Employee ID must be in format: XX-00000 or XXX-00000",
        });
      }
    }

    // Validate department
    if (row.department && !validDepartments.includes(row.department)) {
      errors.push({
        row: rowNumber,
        column: "department",
        value: row.department,
        message: `Department must be one of: ${validDepartments.join(", ")}`,
      });
    }

    // Validate position
    if (row.position && !validPositions.includes(row.position)) {
      errors.push({
        row: rowNumber,
        column: "position",
        value: row.position,
        message: `Position must be one of: ${validPositions.join(", ")}`,
      });
    }

    // Validate email format
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({
        row: rowNumber,
        column: "email",
        value: row.email,
        message: "Invalid email format",
      });
    }

    // Validate join date
    if (row.joinDate) {
      const joinDate = new Date(row.joinDate);
      if (isNaN(joinDate.getTime())) {
        errors.push({
          row: rowNumber,
          column: "joinDate",
          value: row.joinDate,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }
    }
  });

  return errors;
}

async function checkDuplicateEmployeeIds(
  employeeIds: string[],
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Check for duplicates in the import data
  const seen = new Set<string>();
  employeeIds.forEach((id, index) => {
    if (seen.has(id)) {
      errors.push({
        row: index + 2,
        column: "employeeId",
        value: id,
        message: "Duplicate Employee ID in import file",
      });
    }
    seen.add(id);
  });

  // Check for existing employee IDs in database
  const existingEmployees = await UserModel.find({
    employeeId: { $in: employeeIds },
  });
  const existingIds = existingEmployees.map((emp) => emp.employeeId);

  employeeIds.forEach((id, index) => {
    if (existingIds.includes(id)) {
      errors.push({
        row: index + 2,
        column: "employeeId",
        value: id,
        message: "Employee ID already exists in database",
      });
    }
  });

  return errors;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ImportResult>> {
  try {
    // Ensure MongoDB connection
    await connectMongoose();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided. Please select a CSV or Excel file.",
        },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid file type. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.",
        },
        { status: 400 },
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          message: `File size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please choose a smaller file.`,
        },
        { status: 400 },
      );
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join("/tmp", `import-${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    let data: any[] = [];
    let headers: string[] = [];

    try {
      // Parse file based on type
      const isCSV = file.type === "text/csv" || fileExtension === ".csv";

      if (isCSV) {
        // Parse CSV
        const csvContent = buffer.toString();
        const records = await new Promise<any[]>((resolve, reject) => {
          parse(
            csvContent,
            {
              columns: true,
              skip_empty_lines: true,
              trim: true,
            },
            (err, records) => {
              if (err) reject(err);
              else resolve(records);
            },
          );
        });
        data = records;
        headers = Object.keys(records[0] || {});
      } else {
        // Parse Excel
        try {
          const workbook = XLSX.read(buffer, { type: "buffer" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            return NextResponse.json(
              { success: false, message: "File is empty or has no data rows" },
              { status: 400 },
            );
          }

          headers = jsonData[0] as string[];
          data = (jsonData.slice(1) as any[][]).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || "";
            });
            return obj;
          });
        } catch (excelError) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Failed to parse Excel file. Please ensure the file is not corrupted.",
            },
            { status: 400 },
          );
        }
      }

      if (data.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No data found in file. Please ensure the file contains employee data.",
          },
          { status: 400 },
        );
      }

      // Check for required columns
      const requiredColumns = [
        "employeeId",
        "name",
        "department",
        "position",
        "joinDate",
      ];
      const missingColumns = requiredColumns.filter(
        (col) => !headers.includes(col),
      );
      if (missingColumns.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Missing required columns: ${missingColumns.join(", ")}`,
          },
          { status: 400 },
        );
      }

      // Validate data
      const validationErrors = validateEmployeeData(data, headers);

      // Check for duplicate employee IDs
      const employeeIds = data.map((row) => row.employeeId).filter(Boolean);
      const duplicateErrors = await checkDuplicateEmployeeIds(employeeIds);

      const allErrors = [...validationErrors, ...duplicateErrors];

      if (allErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Validation failed with ${allErrors.length} error(s). Please fix the errors and try again.`,
            errors: allErrors,
          },
          { status: 400 },
        );
      }

      // Import valid data
      const importPromises = data.map(async (row) => {
        const hashedPassword = await bcrypt.hash("password123", 12); // Default password

        return UserModel.create({
          employeeId: row.employeeId,
          name: row.name,
          joinDate: new Date(row.joinDate),
          department: row.department,
          position: row.position,
          contactInfo: {
            email: row.email || "",
            phone: row.phone || "",
            address: row.address || "",
          },
          profilePhoto: row.profilePhoto || "",
          role: "employee",
          password: hashedPassword,
        });
      });

      const importedEmployees = await Promise.all(importPromises);

      logger.info(
        `Successfully imported ${importedEmployees.length} employees`,
      );

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedEmployees.length} employee(s) into the system.`,
        importedCount: importedEmployees.length,
      });
    } finally {
      // Clean up temporary file
      try {
        await unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors as they don't affect the import result
        console.warn("Failed to cleanup temporary file:", cleanupError);
        logger.warn(
          `Failed to cleanup temporary file ${tempPath}: ${cleanupError}`,
        );
      }
    }
  } catch (error) {
    console.error("Import error:", error);
    logger.error(
      `Import error: ${error instanceof Error ? error.message : String(error)}`,
    );

    let errorMessage =
      "An error occurred while importing employees. Please try again.";

    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        errorMessage =
          "Duplicate employee IDs found. Please check your data and try again.";
      } else if (error.message.includes("validation failed")) {
        errorMessage =
          "Data validation failed. Please check your file format and try again.";
      } else if (error.message.includes("connection")) {
        errorMessage = "Database connection error. Please try again later.";
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 },
    );
  }
}
