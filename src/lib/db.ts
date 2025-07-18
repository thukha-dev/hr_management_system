import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const uri: string = process.env.MONGODB_URI;
console.log("MongoDB URI:", uri);

// Connection options
const options: MongoClientOptions = {
  // These options help with connection stability
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  connectTimeoutMS: 10000, // Fail fast if initial connection fails
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  retryWrites: true,
  w: "majority",
};

// Create a new MongoClient
const client = new MongoClient(uri, options);

// Create a connection promise
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the connection across module reloads.
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, avoid using a global variable.
  clientPromise = client.connect();
}

// Function to test the connection
async function testConnection() {
  try {
    const testClient = await clientPromise;
    await testClient.db().command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    return false;
  }
}

// Test the connection when this module is imported
if (process.env.NODE_ENV !== "test") {
  testConnection().catch(console.error);
}

export default clientPromise;
