import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

// Log directory
const logDir = path.join(process.cwd(), "logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`Created logs directory at: ${logDir}`);
}

// Custom format for log files
const fileFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${level.toUpperCase()} - ${timestamp} --> ${message}`;
});

// Daily Rotate Transport for combined logs
const combinedTransport = new DailyRotateFile({
  filename: "log-%DATE%.log",
  dirname: logDir,
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",
  createSymlink: true,
  symlinkName: "current.log",
});

// Daily Rotate Transport for error logs
const errorTransport = new DailyRotateFile({
  filename: "error-%DATE%.log",
  dirname: logDir,
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "30d",
  level: "error",
  createSymlink: true,
  symlinkName: "error.log",
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    fileFormat,
  ),
  defaultMeta: { service: "hr-management-system" },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    errorTransport,
    // Write all logs with level `info` and below to `combined.log`
    combinedTransport,
  ],
});

// If we're not in production, also log to the console with colors
if (process.env.NODE_ENV !== "production") {
  const consoleFormat = winston.format.printf(
    ({ level, message, timestamp }) => {
      return `${level.toUpperCase()} - ${timestamp} --> ${message}`;
    },
  );

  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleFormat,
      ),
    }),
  );
}

export default logger;
