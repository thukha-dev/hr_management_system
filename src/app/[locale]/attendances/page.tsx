"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";

// Single-day filter

type AttendanceUser = {
  _id: string;
  employeeId?: string;
  name?: string;
  department?: string;
  position?: string;
};

type AttendanceRecord = {
  _id: string;
  userId: string | AttendanceUser;
  checkIn: string;
  checkOut?: string | null;
  location?: string;
  duration?: string;
};

export default function AttendancesPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const months = 1;

  const dateLabel = useMemo(() => {
    return selectedDate ? format(selectedDate, "dd MMM yyyy") : "Pick a date";
  }, [selectedDate]);

  // Compute lateness based on 9:00 AM local time of the same day as check-in
  const getLateness = (checkInISO: string) => {
    const checkIn = new Date(checkInISO);
    const workStart = new Date(
      checkIn.getFullYear(),
      checkIn.getMonth(),
      checkIn.getDate(),
      9,
      0,
      0,
      0,
    );
    const diffMs = checkIn.getTime() - workStart.getTime();
    if (diffMs <= 0)
      return {
        isLate: false,
        text: "On time",
        className: "text-green-600",
      } as const;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const text = `Late by ${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
    return { isLate: true, text, className: "text-red-600" } as const;
  };

  async function fetchData(signal?: AbortSignal) {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const startOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0,
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        23,
        59,
        59,
        999,
      );
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      const res = await fetch(
        `/api/attendances?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {
          credentials: "include",
          signal,
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load attendances");
      }
      setRows(data?.data || []);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate?.toDateString()]);

  const handleResetToToday = () => setSelectedDate(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Attendances</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[220px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-auto max-w-[90vw] overflow-auto"
              align="end"
            >
              <Calendar
                mode="single"
                numberOfMonths={months}
                selected={selectedDate as any}
                onSelect={(d: any) => d && setSelectedDate(d)}
                defaultMonth={selectedDate}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchData()}
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetToToday}>
            Today
          </Button>
        </div>
      </div>

      <Card className="p-2">
        {error ? <div className="p-4 text-sm text-red-600">{error}</div> : null}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          )}
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-[200px]">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    No records
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const user = (
                    typeof r.userId === "object" ? r.userId : undefined
                  ) as AttendanceUser | undefined;
                  return (
                    <TableRow key={r._id}>
                      <TableCell>{user?.employeeId ?? "-"}</TableCell>
                      <TableCell>{user?.name ?? "-"}</TableCell>
                      <TableCell>{user?.department ?? "-"}</TableCell>
                      <TableCell>{user?.position ?? "-"}</TableCell>
                      <TableCell>
                        {format(new Date(r.checkIn), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const late = getLateness(r.checkIn);
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                                late.isLate ? "bg-red-50" : "bg-green-50",
                                late.className,
                              )}
                            >
                              {late.text}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {r.checkOut
                          ? format(new Date(r.checkOut), "dd MMM yyyy, HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {r.duration ?? (r.checkOut ? "-" : "In progress")}
                      </TableCell>
                      <TableCell
                        className="w-[200px] truncate"
                        title={r.location || undefined}
                      >
                        {r.location ?? "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
