import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import clientPromise from "@/lib/db";

// Extend the client promise type to include the db method
type MongoClientWithDb = MongoClient & {
  db: (dbName?: string) => any; // Using any here to avoid type complexity
};

export async function GET() {
  try {
    // Cast the client to the extended type
    const client = (await clientPromise) as unknown as MongoClientWithDb;
    
    if (!client || typeof client.db !== 'function') {
      throw new Error('MongoDB client is not properly initialized');
    }
    
    // Get the database name from the connection string
    const dbName = process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || 'test';
    const db = client.db(dbName);

    // Test the connection by listing all databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    // Test a simple query to verify the connection
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to MongoDB",
      database: dbName,
      collections: collections.map((c: { name: string }) => c.name),
      allDatabases: dbs.databases.map((db: { name: string }) => db.name),
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
