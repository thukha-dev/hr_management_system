import { jwtVerify } from "jose";
import logger from "./logger";

const secret = new TextEncoder().encode(process.env.NEXT_AUTH_JWT_SECRET!);

// Decode & verify token from cookies (middleware-safe)
export async function getUserFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    logger.info("payload is --- ", payload);
    return payload as {
      email: string;
      name?: string;
      role?: string;
    };
  } catch (error) {
    logger.error("[auth] Invalid token:", error);
    return null;
  }
}
