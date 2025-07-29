'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/types/auth';
import { connectDB } from '@/lib/db';
import User from '@/app/models/User';
import { uploadImage } from '@/lib/cloudinary';
import bcrypt from 'bcryptjs';

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

export async function addEmployee(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    // Extract all form data
    const employeeId = formData.get('employeeId') as string;
    const name = formData.get('name') as string;
    const joinDate = formData.get('joinDate') as string;
    const department = formData.get('department') as string;
    const position = formData.get('position') as string;
    const role = formData.get('role') as UserRole;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const profilePhotoFile = formData.get('profilePhoto') as File | null;
    const password = formData.get('password') as string;
    
    // Connect to database
    await connectDB();

    // Validate all fields
    const errors: Record<string, string> = {};
    
    if (!employeeId?.trim()) errors.employeeId = 'Employee ID is required';
    if (!name?.trim()) errors.name = 'Full name is required';
    if (!joinDate) errors.joinDate = 'Join date is required';
    if (!department?.trim()) errors.department = 'Department is required';
    if (!position?.trim()) errors.position = 'Position is required';
    if (!role) errors.role = 'Role is required';
    
    // Contact info validation
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!isValidPhone(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!address?.trim()) errors.address = 'Address is required';
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    // Profile photo validation (if provided)
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      if (profilePhotoFile.size > 5 * 1024 * 1024) { // 5MB limit
        errors.profilePhoto = 'Profile photo must be less than 5MB';
      } else if (!profilePhotoFile.type.startsWith('image/')) {
        errors.profilePhoto = 'Please upload a valid image file';
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Handle profile photo if provided
    let profilePhotoUrl = '';
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      try {
        console.log('Uploading profile photo...', {
          fileName: profilePhotoFile.name,
          fileSize: profilePhotoFile.size,
          fileType: profilePhotoFile.type
        });
        
        // Upload to Cloudinary
        profilePhotoUrl = await uploadImage(profilePhotoFile);
        console.log('Profile photo uploaded successfully:', profilePhotoUrl);
      } catch (error) {
        console.error('Error uploading profile photo:', {
          error,
          errorString: String(error),
          errorStack: error instanceof Error ? error.stack : 'No stack trace',
          fileName: profilePhotoFile?.name,
          fileSize: profilePhotoFile?.size,
          fileType: profilePhotoFile?.type
        });
        return {
          success: false,
          message: 'Failed to upload profile photo',
          errors: { 
            profilePhoto: error instanceof Error 
              ? `Upload failed: ${error.message}` 
              : 'Failed to upload profile photo. Please try again.'
          }
        };
      }
    }

    try {
      // Check if employee ID or email already exists
      const existingEmployee = await User.findOne({
        $or: [
          { employeeId },
          { 'contactInfo.email': email?.trim() }
        ]
      });

      if (existingEmployee) {
        if (existingEmployee.employeeId === employeeId) {
          return {
            success: false,
            errors: { employeeId: 'An employee with this ID already exists' }
          };
        }
        if (existingEmployee.contactInfo?.email === email?.trim()) {
          return {
            success: false,
            errors: { email: 'An employee with this email already exists' }
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
          address: address.trim()
        },
        profilePhoto: profilePhotoUrl,
        password: hashedPassword
      });

      await newEmployee.save();
      console.log('Employee saved successfully:', newEmployee);

      // Revalidate the employees page
      revalidatePath('/[locale]/employees', 'page');

      return { 
        success: true, 
        message: 'Employee added successfully',
        data: {
          id: newEmployee._id,
          employeeId: newEmployee.employeeId,
          name: newEmployee.name
        }
      };
    } catch (error: any) {
      console.error('Error saving employee to database:', error);
      // Handle duplicate key error
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Duplicate key error',
          errors: { _form: 'An employee with this ID or email already exists' }
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      return {
        success: false,
        message: 'Failed to add employee',
        errors: { _form: errorMessage }
      };
    }
  } catch (error) {
    console.error('Error adding employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add employee';
    return { 
      success: false, 
      message: errorMessage,
      errors: {
        _form: errorMessage
      }
    };
  }
}
