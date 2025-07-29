import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a MongoDB document to a plain JavaScript object
 * Handles common MongoDB types like ObjectId and Date
 */
export function toPlainObject<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc as T;

  // Handle dates
  if (doc instanceof Date) return doc.toISOString() as unknown as T;

  // Handle arrays
  if (Array.isArray(doc))
    return doc.map((item) => toPlainObject(item)) as unknown as T;

  // Handle objects
  if (typeof doc === "object") {
    // Handle MongoDB ObjectId
    if (doc._id && typeof doc._id === "object" && "toString" in doc._id) {
      doc._id = doc._id.toString();
    }

    // Convert all properties recursively
    const result: Record<string, any> = {};
    for (const key in doc) {
      if (doc.hasOwnProperty(key)) {
        result[key] = toPlainObject(doc[key]);
      }
    }
    return result as T;
  }

  // Return primitives as is
  return doc as T;
}
