import "dotenv/config";
import { connect, disconnect } from "mongoose";
import { UserModel, UserRole } from "@/app/models/User";
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

    const email = "admin@example.com";
    const password = "password123"; // More secure default password

    console.log("🔍 Checking for existing admin user...");
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      console.log("🔄 Updating existing admin user...");
      existingUser.password = await bcrypt.hash(password, 12);
      existingUser.role = UserRole.SuperAdmin;
      await existingUser.save();
    } else {
      console.log("👤 Creating new admin user...");
      await UserModel.create({
        name: "Super Admin",
        email,
        password: await bcrypt.hash(password, 12),
        role: UserRole.SuperAdmin,
      });
    }

    console.log("✅ Super admin user created/updated successfully!");
    console.log("📧 Email:", email);
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
