// This script must be run with the --import flag to ensure proper module loading
// Example: npx tsx --import ./scripts/register-ts-paths.js scripts/test-api.ts

// Load environment variables from .env.local before any other imports
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), ".env.local");
console.log("Loading environment variables from:", envPath);

// Load environment variables directly into process.env
const envConfig = config({ path: envPath, override: true });
if (envConfig.error) {
  console.error("Error loading .env file:", envConfig.error);
  process.exit(1);
}

// Debug: Log that environment variables were loaded
console.log("Environment variables loaded successfully");

// Import other dependencies after loading environment variables
import db from "@/lib/db";
import User from "@/app/models/User";

async function testEmployeesAPI() {
  try {
    console.log("Testing /api/employees endpoint...");

    // Connect to the database
    console.log("Connecting to database...");
    await db.connectDB();

    // Test database connection with a simple query
    console.log("Testing database connection...");
    const userCount = await User.countDocuments();
    console.log(
      `✅ Successfully connected to database. Found ${userCount} users.`,
    );

    // Test the API endpoint
    console.log("\nTesting API endpoint...");
    const response = await fetch("http://localhost:3000/api/employees");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${data.error || "Unknown error"}`);
    }

    console.log("✅ API Response:", {
      status: response.status,
      userCount: Array.isArray(data) ? data.length : "Invalid response format",
      firstUser:
        Array.isArray(data) && data.length > 0 ? data[0] : "No users found",
    });
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    // Close the database connection
    if (db.mongoose) {
      await db.mongoose.connection.close();
    }
    console.log("\nTest completed.");
    process.exit(0);
  }
}

// Run the test
testEmployeesAPI();
