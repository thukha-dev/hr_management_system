// Edge-compatible logger that works in both Node.js and Edge runtimes

// Simple console logger that works in both environments
export const logger = {
  // Debug level - only shown in development
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} --> ${message}`,
        data || "",
      );
    }
  },

  // Info level - general operational logs
  info: (message: string, data?: any) => {
    console.info(
      `[INFO] ${new Date().toISOString()} --> ${message}`,
      data || "",
    );
  },

  // Warning level - handled exceptions or other issues
  warn: (message: string, data?: any) => {
    console.warn(
      `[WARN] ${new Date().toISOString()} --> ${message}`,
      data || "",
    );
  },

  // Error level - failed operations
  error: (message: string | Error, error?: any) => {
    if (message instanceof Error) {
      console.error(
        `[ERROR] ${new Date().toISOString()} -->`,
        message,
        error || "",
      );
    } else {
      console.error(
        `[ERROR] ${new Date().toISOString()} --> ${message}`,
        error || "",
      );
    }
  },
};

// Note: Process event handlers are removed for Edge Runtime compatibility
// In a production environment, consider handling these at the platform level
// or using a service like Sentry for error tracking

export default logger;
