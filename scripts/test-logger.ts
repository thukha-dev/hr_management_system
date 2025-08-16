import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Skip this script entirely on Vercel (read-only filesystem at /vercel/path0)
if (process.env.VERCEL) {
  console.log("Skipping test-logger on Vercel environment.");
  process.exit(0);
}

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the logger from the source directory
import logger from "../src/lib/logger.js";

// Test the logger
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");

// Log the directory where logs are being written
const logsDir = path.join(process.cwd(), "logs");
console.log(`Logs are being written to: ${logsDir}`);

// List the log files
import fs from "fs";
if (fs.existsSync(logsDir)) {
  console.log("Log files:");
  fs.readdirSync(logsDir).forEach((file) => {
    console.log(`- ${file}`);
  });
} else {
  console.error(
    "Logs directory not found. Please check the logger configuration.",
  );
}
