import { CheckInOutRecord } from "@/types/interface";

async function getAuthHeader() {
  // In a real app, get the token from your auth provider
  // For NextAuth, you can use getSession() or getToken() on the client side
  const { data: session } = await fetch("/api/auth/session").then((res) =>
    res.json(),
  );
  return {
    "Content-Type": "application/json",
    ...(session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : {}),
  };
}

export async function getAttendanceRecords(): Promise<CheckInOutRecord[]> {
  try {
    const response = await fetch("/api/attendance", {
      headers: await getAuthHeader(),
      credentials: "include", // Important for sending cookies
    });
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data.message || "Failed to fetch attendance records",
      );
      if (data.error) {
        console.error("API Error:", data.error);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getAttendanceRecords:", error);
    throw error;
  }
}

export async function checkInOut(
  latitude: number,
  longitude: number,
): Promise<CheckInOutResponse> {
  try {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: await getAuthHeader(),
      credentials: "include", // Important for sending cookies
      body: JSON.stringify({ latitude, longitude }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data.message || "Failed to update check-in/out status",
      );
      if (data.error) {
        console.error("API Error:", data.error);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in checkInOut:", error);
    throw error;
  }
}

export type CheckInOutResponse = {
  success: boolean;
  action: "checkin" | "checkout";
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  location?: string;
};
