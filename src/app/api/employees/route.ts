import { NextResponse } from 'next/server';
import db from '@/lib/db';
import User from '@/app/models/User';

// Simple type for the user object we'll return
type UserResponse = {
  _id: string;
  employeeId: string;
  name: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  department?: string;
  position?: string;
  status?: string;
  joinDate?: string | null;
  profilePhoto?: string;
  role?: string;
};

const { connectDB } = db;

export async function GET() {
  try {
    // Connect to MongoDB using our utility
    await connectDB();
    
    // Fetch all users, excluding the password field
    const users = await User.find({})
      .select('-password') // Exclude password field
      .lean() // Convert to plain JavaScript objects
      .exec();
    
    // Convert MongoDB documents to response objects
    const employees = users.map((user: any): UserResponse => {
      // Create a new object with only the properties we want to expose
      const response: UserResponse = {
        _id: user._id?.toString() || '',
        employeeId: user.employeeId || '',
        name: user.name || '',
        contactInfo: user.contactInfo ? { ...user.contactInfo } : undefined,
        department: user.department,
        position: user.position,
        status: user.status || 'active',
        profilePhoto: user.profilePhoto,
        role: user.role,
      };
      
      // Format the joinDate if it exists
      if (user.joinDate) {
        response.joinDate = new Date(user.joinDate).toISOString();
      }
      
      return response;
    });
    
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employees',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Add CORS headers for API routes
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering
