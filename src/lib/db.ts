import { MongoClient, MongoClientOptions, MongoServerError } from "mongodb";
import logger from "./logger";

if (!process.env.MONGODB_URI) {
  const error = new Error("Please add your Mongo URI to .env.local");
  logger.error(error.message);
  throw error;
}

const uri: string = process.env.MONGODB_URI;
logger.info(`MongoDB URI: ${uri}`);

// Connection options
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

// Create a connection promise
let clientPromise: Promise<MongoClient>;

// Function to test the connection
async function testConnection() {
  try {
    logger.info("Attempting to connect to MongoDB...");
    const testClient = await MongoClient.connect(uri, options);
    await testClient.db().command({ ping: 1 });
    logger.info("Successfully connected to MongoDB");
    return true;
  } catch (error) {
    if (error instanceof MongoServerError) {
      const errorMessage = `MongoDB Server Error (${error.codeName}): ${error.message}`;
      logger.error(errorMessage);

      if (error.codeName === "AuthenticationFailed") {
        const authError =
          "Authentication failed. Please check your MongoDB credentials.";
        logger.error(authError);
      } else if (error.codeName === "BadValue") {
        const badValueError =
          "Invalid connection string. Please check your MONGODB_URI.";
        logger.error(badValueError);
      }
    } else if (error instanceof Error) {
      logger.error(`Connection Error: ${error.message}`);

      if (error.message.includes("ECONNREFUSED")) {
        const connectionRefused =
          "MongoDB server is not running or not accessible at the specified address.";
        logger.error(connectionRefused);
        logger.error(`Connection URI: ${uri}`);
      }
    }
    return false;
  }
}

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

// Test the connection when this module is imported
if (process.env.NODE_ENV !== "test") {
  testConnection().catch(console.error);
}

export default clientPromise;
