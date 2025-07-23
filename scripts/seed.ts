import "dotenv/config";
import { connect, disconnect } from "mongoose";
import UserModel from "@/app/models/User";
import { UserRole } from "@/types/auth";
import bcrypt from "bcryptjs";

async function seedSuperAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    console.log("🔌 Connecting to MongoDB...");
    await connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const employeeId = "MOT-00001";
    const name = "Super Admin";
    const joinDate = new Date();
    const department = "IT";
    const position = "IT Manager";
    const contactInfo = {
      phone: "+1234567890",
      email: "admin@example.com",
      address: "123 Main St, Anytown, USA",
    };
    const profilePhoto = "https://example.com/profile.jpg";
    const role = UserRole.SuperAdmin;
    const password = "password123"; // More secure default password

    console.log("🔍 Checking for existing admin user...");
    const existingUser = await UserModel.findOne({ employeeId });

    if (existingUser) {
      console.log("🔄 Updating existing admin user...");
      existingUser.password = await bcrypt.hash(password, 12);
      existingUser.role = UserRole.SuperAdmin;
      await existingUser.save();
    } else {
      console.log("👤 Creating new admin user...");
      await UserModel.create({
        employeeId,
        name,
        joinDate,
        department,
        position,
        contactInfo,
        profilePhoto,
        role,
        password: await bcrypt.hash(password, 12),
      });
    }

    console.log("✅ Super admin user created/updated successfully!");
    console.log("📧 Employee ID:", employeeId);
    console.log("🔑 Password:", password);
    console.log("👑 Role:", UserRole.SuperAdmin);
  } catch (error) {
    console.error("❌ Error seeding super admin:");
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if ("errors" in error) {
        console.error("Validation errors:", error.errors);
      }
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  } finally {
    await disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Run the seed function
seedSuperAdmin();

// MONGODB_URI=mongodb://localhost:27017/hr_management_system_db npx tsx scripts/seed.ts
