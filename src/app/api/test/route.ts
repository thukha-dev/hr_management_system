import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Test the connection by listing all databases
    const dbs = await client.db().admin().listDatabases();

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to MongoDB",
      databases: dbs.databases.map((db) => db.name),
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
