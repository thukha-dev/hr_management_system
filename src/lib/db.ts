import { MongoClient, MongoClientOptions, MongoServerError } from "mongodb";
import mongoose from "mongoose";
import logger from "./logger";

if (!process.env.MONGODB_URI) {
  const error = new Error("Please add your Mongo URI to .env.local");
  logger.error(error.message);
  throw error;
}

const uri: string = process.env.MONGODB_URI;
logger.info(`MongoDB URI: ${uri}`);

// Connection options for MongoDB native driver
const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: "majority",
};

// Create a new MongoClient
const client = new MongoClient(uri, options);

// Create a connection promise for MongoDB native driver
let clientPromise: Promise<MongoClient>;

// Mongoose connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the connection across module reloads.
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log("Creating new MongoDB connection...");
    globalWithMongo._mongoClientPromise = client
      .connect()
      .then((connectedClient) => {
        console.log("✅ MongoDB client connected successfully");
        return connectedClient;
      })
      .catch((error) => {
        console.error("❌ Failed to connect to MongoDB:", error);
        throw error;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, avoid using a global variable.
  clientPromise = client
    .connect()
    .then((connectedClient) => {
      console.log("✅ MongoDB client connected successfully in production");
      return connectedClient;
    })
    .catch((error) => {
      console.error("❌ Failed to connect to MongoDB in production:", error);
      throw error;
    });
}

// Connection is now handled by the main connection logic
// MongoDB client connection
export const db = {
  // Connection is now handled by the main connection logic
  client: clientPromise,
};

// Mongoose connection
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected via Mongoose");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
}

// Connect to MongoDB with Mongoose
const connectMongoose = async () => {
  // If already connected, use existing connection
  if (mongoose.connection.readyState >= 1) {
    logger.info("Using existing database connection");
    return;
  }

  try {
    logger.info("Creating new database connection with Mongoose...");
    await mongoose.connect(uri, mongooseOptions);
    logger.info("✅ MongoDB connected via Mongoose");
  } catch (error) {
    if (error instanceof Error) {
      logger.error("MongoDB connection error:", error.message);
    } else {
      logger.error("Unknown MongoDB connection error");
    }
    // Exit process with failure
    process.exit(1);
  }
};

// Handle application termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    logger.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

// Export the MongoDB client and Mongoose connection
export const dbClient = client;
export const mongooseConnection = mongoose;

export default {
  connectDB: connectMongoose,
  client,
  mongoose,
  // Export the existing db object for backward compatibility
  ...Object.fromEntries(
    Object.entries(db).filter(
      ([key]) => key !== "client" && key !== "mongoose",
    ),
  ),
};
