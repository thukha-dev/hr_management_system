import pino from "pino";
import pinoPretty from "pino-pretty";
import path from "path";
import fs from "fs";

// Log directory
const logDir = path.join(process.cwd(), "logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`Created logs directory at: ${logDir}`);
}

// Common log format for console
const prettyPrint = pinoPretty({
  colorize: true,
  translateTime: "SYS:standard",
  ignore: "pid,hostname",
  messageFormat: "{time} --> {msg}",
});

// Create the logger instance
const logger = pino(
  {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    // timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream([
    // Console output in development, pretty print
    {
      level: "debug",
      stream: prettyPrint,
    },
    // File output for all logs
    {
      level: "info",
      stream: pino.destination({
        dest: path.join(logDir, "combined.log"),
        sync: false,
        mkdir: true,
      }),
    },
    // Error logs to separate file
    {
      level: "error",
      stream: pino.destination({
        dest: path.join(logDir, "error.log"),
        sync: false,
        mkdir: true,
      }),
    },
  ]),
);

// Log unhandled exceptions
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ err: reason, promise }, "Unhandled Rejection");
  process.exit(1);
});

export default logger;
