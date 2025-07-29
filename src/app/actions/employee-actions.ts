"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/types/auth";
import { connectDB } from "@/lib/db";
import User from "@/app/models/User";
import { uploadImage } from "@/lib/cloudinary";
import bcrypt from "bcryptjs";

type FormState = {
  success?: boolean;
  errors?: Record<string, string>;
  message?: string;
  data?: {
    id: string;
    employeeId: string;
    name: string;
  };
};

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate phone number format
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Type for employee update data
type UpdateEmployeeData = {
  name: string;
  email: string;
  department: string;
  position: string;
  status?: string;
  joinDate?: string;
};

type UpdateEmployeeResponse = {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    department: string;
    position: string;
    status: string;
    joinDate: string;
    profilePhoto?: string;
    contactInfo: {
      email: string;
      phone: string;
      address: string;
    };
  };
};

export async function updateEmployee(
  id: string,
  formData: FormData,
): Promise<UpdateEmployeeResponse> {
  try {
    // Extract form data
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const department = formData.get("department") as string;
    const position = formData.get("position") as string;
    const status = formData.get("status") as string;
    const joinDate = formData.get("joinDate") as string;

    // Connect to database
    await connectDB();

    // Prepare update data
    const updateData = {
      name,
      "contactInfo.email": email,
      department,
      position,
      status: status || "active",
      ...(joinDate && { joinDate: new Date(joinDate) }),
    };

    // Find and update the employee
    const updatedEmployeeDoc = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedEmployeeDoc) {
      return { success: false, message: "Employee not found" };
    }

    // Revalidate the employees page to show the updated data
    revalidatePath("/[locale]/employees", "page");

    // Convert the updated employee to a plain object
    const updatedEmployee = await User.findById(id).lean().exec();

    if (!updatedEmployee) {
      return {
        success: false,
        message: "Employee not found after update",
      };
    }

    // Type assertion to handle the MongoDB document
    const employeeDoc = updatedEmployee as any;

    // Create a plain object with only the fields we need
    const plainEmployee = {
      _id: employeeDoc._id?.toString() || "",
      employeeId: employeeDoc.employeeId || "",
      name: employeeDoc.name || "",
      email: employeeDoc.contactInfo?.email || "",
      phone: employeeDoc.contactInfo?.phone || "",
      address: employeeDoc.contactInfo?.address || "",
      department: employeeDoc.department || "",
      position: employeeDoc.position || "",
      status: employeeDoc.status || "active",
      joinDate: employeeDoc.joinDate?.toISOString() || new Date().toISOString(),
      profilePhoto: employeeDoc.profilePhoto || "",
      contactInfo: {
        email: employeeDoc.contactInfo?.email || "",
        phone: employeeDoc.contactInfo?.phone || "",
        address: employeeDoc.contactInfo?.address || "",
      },
    };

    return {
      success: true,
      message: "Employee updated successfully",
      data: plainEmployee,
    };
  } catch (error) {
    console.error("Error updating employee:", error);
    return {
      success: false,
      message: "Failed to update employee. Please try again.",
    };
  }
}

export async function deleteEmployee(
  id: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await connectDB();

    const deletedEmployee = await User.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return { success: false, message: "Employee not found" };
    }

    // Revalidate the employees page to show updated data
    revalidatePath("/employees");

    return {
      success: true,
      message: "Employee deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return {
      success: false,
      message: "Failed to delete employee. Please try again.",
    };
  }
}

export async function addEmployee(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    // Extract all form data
    const employeeId = formData.get("employeeId") as string;
    const name = formData.get("name") as string;
    const joinDate = formData.get("joinDate") as string;
    const department = formData.get("department") as string;
    const position = formData.get("position") as string;
    const role = formData.get("role") as UserRole;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const profilePhotoFile = formData.get("profilePhoto") as File | null;
    const password = formData.get("password") as string;

    // Connect to database
    await connectDB();

    // Validate all fields
    const errors: Record<string, string> = {};

    if (!employeeId?.trim()) errors.employeeId = "Employee ID is required";
    if (!name?.trim()) errors.name = "Full name is required";
    if (!joinDate) errors.joinDate = "Join date is required";
    if (!department?.trim()) errors.department = "Department is required";
    if (!position?.trim()) errors.position = "Position is required";
    if (!role) errors.role = "Role is required";

    // Contact info validation
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    if (!address?.trim()) errors.address = "Address is required";

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    // Profile photo validation (if provided)
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      if (profilePhotoFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        errors.profilePhoto = "Profile photo must be less than 5MB";
      } else if (!profilePhotoFile.type.startsWith("image/")) {
        errors.profilePhoto = "Please upload a valid image file";
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Handle profile photo if provided
    let profilePhotoUrl = "";
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      try {
        console.log("Uploading profile photo...", {
          fileName: profilePhotoFile.name,
          fileSize: profilePhotoFile.size,
          fileType: profilePhotoFile.type,
        });

        // Upload to Cloudinary
        profilePhotoUrl = await uploadImage(profilePhotoFile);
        console.log("Profile photo uploaded successfully:", profilePhotoUrl);
      } catch (error) {
        console.error("Error uploading profile photo:", {
          error,
          errorString: String(error),
          errorStack: error instanceof Error ? error.stack : "No stack trace",
          fileName: profilePhotoFile?.name,
          fileSize: profilePhotoFile?.size,
          fileType: profilePhotoFile?.type,
        });
        return {
          success: false,
          message: "Failed to upload profile photo",
          errors: {
            profilePhoto:
              error instanceof Error
                ? `Upload failed: ${error.message}`
                : "Failed to upload profile photo. Please try again.",
          },
        };
      }
    }

    try {
      // Check if employee ID or email already exists
      const existingEmployee = await User.findOne({
        $or: [{ employeeId }, { "contactInfo.email": email?.trim() }],
      });

      if (existingEmployee) {
        if (existingEmployee.employeeId === employeeId) {
          return {
            success: false,
            errors: { employeeId: "An employee with this ID already exists" },
          };
        }
        if (existingEmployee.contactInfo?.email === email?.trim()) {
          return {
            success: false,
            errors: { email: "An employee with this email already exists" },
          };
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new employee
      const newEmployee = new User({
        employeeId,
        name,
        joinDate: new Date(joinDate),
        department,
        position,
        role,
        contactInfo: {
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        profilePhoto: profilePhotoUrl,
        password: hashedPassword,
      });

      await newEmployee.save();
      console.log("Employee saved successfully:", newEmployee);

      // Revalidate the employees page
      revalidatePath("/[locale]/employees", "page");

      // Convert the MongoDB document to a plain object
      const plainEmployee = {
        _id: newEmployee._id?.toString(),
        employeeId: newEmployee.employeeId,
        name: newEmployee.name,
        email: newEmployee.contactInfo?.email,
        phone: newEmployee.contactInfo?.phone,
        address: newEmployee.contactInfo?.address,
        department: newEmployee.department,
        position: newEmployee.position,
        status: newEmployee.status,
        joinDate: newEmployee.joinDate?.toISOString(),
        profilePhoto: newEmployee.profilePhoto,
        contactInfo: {
          email: newEmployee.contactInfo?.email,
          phone: newEmployee.contactInfo?.phone,
          address: newEmployee.contactInfo?.address,
        },
      };

      return {
        success: true,
        message: "Employee added successfully",
        data: {
          id: plainEmployee._id,
          employeeId: plainEmployee.employeeId,
          name: plainEmployee.name,
        },
      };
    } catch (error: any) {
      console.error("Error saving employee to database:", error);
      // Handle duplicate key error
      if (error.code === 11000) {
        return {
          success: false,
          message: "Duplicate key error",
          errors: { _form: "An employee with this ID or email already exists" },
        };
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      return {
        success: false,
        message: "Failed to add employee",
        errors: { _form: errorMessage },
      };
    }
  } catch (error) {
    console.error("Error adding employee:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add employee";
    return {
      success: false,
      message: errorMessage,
      errors: {
        _form: errorMessage,
      },
    };
  }
}
