"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  XCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, formatDistanceToNow, isToday } from "date-fns";
import {
  getAttendanceRecords,
  checkInOut,
  CheckInOutResponse,
} from "@/lib/api/attendance";
import { useSession } from "@/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceRecord {
  id: string;
  userId: string;
  checkIn: Date;
  checkOut?: Date;
  location?: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function CheckInOutPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [lastCheckOut, setLastCheckOut] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>(
    "Getting location...",
  );
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
            );
            const data = await response.json();
            setCurrentLocation(data.display_name || "Location not available");
          } catch (error) {
            console.error("Error getting location:", error);
            setCurrentLocation("Location not available");
          } finally {
            setIsLocationLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setCurrentLocation("Location access denied");
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setCurrentLocation("Geolocation not supported");
      setIsLocationLoading(false);
    }
  }, []);

  // Fetch attendance records and check-in status
  useEffect(() => {
    if (!sessionLoading && session) {
      loadAttendanceRecords();
    }
  }, [session, sessionLoading]);

  const loadAttendanceRecords = async () => {
    try {
      setIsLoading(true);
      const data = await getAttendanceRecords();

      // Transform the data to match our AttendanceRecord type
      const formattedRecords = data.map((record: any) => ({
        id: record._id || record.id,
        userId: record.userId,
        checkIn: new Date(record.checkIn),
        checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
        location: record.location,
        duration: record.duration,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      }));

      // Check if user is currently checked in (has a record with no check-out)
      const currentCheckIn = formattedRecords.find(
        (r: AttendanceRecord) => !r.checkOut,
      );

      if (currentCheckIn) {
        setIsCheckedIn(true);
        setLastCheckIn(currentCheckIn.checkIn);
      } else {
        setIsCheckedIn(false);
        setLastCheckIn(formattedRecords[0]?.checkIn || null);
      }

      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      toast.error("Error", {
        description: "Failed to load attendance records. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckInOut = async () => {
    if (!session) {
      toast.error("You must be logged in to check in/out");
      return;
    }

    setIsCheckingLocation(true);
    setLocationError(null);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      // Call check-in/out API
      const result = await checkInOut(latitude, longitude);

      if (result.success) {
        // Update UI based on the result
        if (result.action === "checkin") {
          toast.success("Checked in successfully");
          setIsCheckedIn(true);
          setLastCheckIn(new Date());
        } else {
          toast.success("Checked out successfully");
          setIsCheckedIn(false);
          setLastCheckOut(new Date());

          // Show duration if available
          if (result.duration) {
            const durationMatch = result.duration.match(/(\d+)h (\d+)m/);
            if (durationMatch) {
              const hours = parseInt(durationMatch[1]);
              const minutes = parseInt(durationMatch[2]);
              toast.info(`You worked for ${hours}h ${minutes}m`);
            }
          }
        }

        // Refresh the attendance records
        await loadAttendanceRecords();
      } else {
        toast.error("Failed to update check-in/out status");
      }
    } catch (error) {
      console.error("Error during check-in/out:", error);
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to update check-in/out status",
      });
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  const formatDate = (date: Date) => {
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left column - Check in/out card */}
        <div className="w-full md:w-1/3">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold">
                {isCheckedIn ? "You're Checked In" : "Check In"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{formatDate(new Date())}</span>
                </div>
                <div className="flex items-start text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                  {isLocationLoading ? (
                    <Skeleton className="h-4 w-3/4" />
                  ) : (
                    <div className="min-w-0">
                      <p
                        className="break-words line-clamp-2"
                        title={currentLocation}
                      >
                        {currentLocation}
                      </p>
                    </div>
                  )}
                </div>
                {isCheckedIn && lastCheckIn && (
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Since {formatTime(lastCheckIn)}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCheckInOut}
                disabled={isCheckingLocation}
                className="w-full h-11 text-base"
                size="lg"
              >
                {isCheckingLocation ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : isCheckedIn ? (
                  "Check Out"
                ) : (
                  "Check In Now"
                )}
              </Button>

              {isCheckedIn && (
                <div className="text-center text-sm text-muted-foreground">
                  You're checked in since{" "}
                  {lastCheckIn && formatTime(lastCheckIn)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Current month attendance record */}
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{`${format(new Date(), "MMMM")} Attendance Record`}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : attendanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {attendanceRecords.map((record, index) => (
                    <div
                      key={record.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg ${
                        index === 0 && isCheckedIn ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="mb-2 md:mb-0">
                        <div className="font-medium">
                          {formatDate(record.checkIn)}
                          {index === 0 && isCheckedIn && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                              In Progress
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatTime(record.checkIn)}
                          {record.checkOut &&
                            ` - ${formatTime(record.checkOut)}`}
                          {record.duration && ` • ${record.duration}`}
                        </div>
                        {record.location?.address && (
                          <div className="text-sm text-muted-foreground flex items-start mt-1">
                            <MapPin className="mr-1 h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span
                              className="line-clamp-2 break-words"
                              title={record.location.address}
                            >
                              {record.location.address}
                            </span>
                          </div>
                        )}
                      </div>
                      {!record.checkOut && index === 0 && isCheckedIn ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCheckInOut}
                          disabled={isCheckingLocation}
                        >
                          {isCheckingLocation ? "Processing..." : "Check Out"}
                        </Button>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {record.duration || "In progress"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No check-in records found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
