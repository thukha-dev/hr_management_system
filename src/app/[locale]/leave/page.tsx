"use client";

import { useState } from "react";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LeaveRequestDialog } from "@/components/leave/leave-request-dialog";

type LeaveType =
  | "annual"
  | "sick"
  | "unpaid"
  | "maternity"
  | "paternity"
  | "half-unpaid";

interface LeaveBalance {
  type: string;
  total: number;
  remaining: number;
  used: number;
}

interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  days: number;
  notes?: string;
  submittedDate: string;
}

export default function LeavePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data
  const leaveBalances: Record<LeaveType, LeaveBalance> = {
    annual: { type: "Annual", total: 15, remaining: 10, used: 5 },
    sick: { type: "Sick", total: 10, remaining: 7, used: 3 },
    unpaid: { type: "Unpaid", total: 30, remaining: 30, used: 0 },
    "half-unpaid": { type: "Half Unpaid", total: 30, remaining: 30, used: 0 },
    maternity: { type: "Maternity", total: 84, remaining: 84, used: 0 },
    paternity: { type: "Paternity", total: 14, remaining: 14, used: 0 },
  };

  const leaveRequests: LeaveRequest[] = [
    {
      id: "1",
      type: "annual",
      startDate: "2025-01-15",
      endDate: "2025-01-17",
      status: "approved",
      days: 3,
      notes: "Family vacation",
      submittedDate: "2024-12-20",
    },
    {
      id: "2",
      type: "sick",
      startDate: "2025-02-01",
      endDate: "2025-02-02",
      status: "approved",
      days: 2,
      submittedDate: "2025-01-30",
    },
    {
      id: "3",
      type: "annual",
      startDate: "2025-03-10",
      endDate: "2025-03-11",
      status: "pending",
      days: 2,
      notes: "Dental appointment",
      submittedDate: "2025-02-25",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Pending
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSubmitLeaveRequest = (values: any) => {
    // In a real app, you would make an API call here
    console.log("Submitting leave request:", values);

    // Show success message
    toast.success(
      `Your ${values.leaveType} leave request has been submitted for approval.`,
    );

    // Close the dialog
    setIsDialogOpen(false);

    // In a real app, you would refresh the leave requests list here
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Leave Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View your leave balances and request time off
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto mt-2 sm:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>Request Leave</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Object.entries(leaveBalances).map(([key, balance]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {balance.type}
              </CardTitle>
              <CardDescription>
                {balance.remaining} of {balance.total} days remaining
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(balance.used / balance.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {balance.used} days used
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Tabs defaultValue="my-leave" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b">
            <div className="w-full overflow-x-auto pb-2 sm:pb-0">
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-5 min-w-max">
                <TabsTrigger value="my-leave">My Leave</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="my-leave" className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-medium">
                          {request.type.charAt(0).toUpperCase() +
                            request.type.slice(1)}{" "}
                          Leave
                        </h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(request.startDate)} -{" "}
                          {formatDate(request.endDate)}
                        </p>
                        {request.notes && (
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            {request.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 sm:gap-4">
                      <div className="flex items-center text-xs sm:text-sm">
                        <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>
                          {request.days} {request.days === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 sm:px-3"
                      >
                        <span className="text-xs sm:text-sm">View Details</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Other tab contents would go here */}
          <TabsContent value="pending" className="p-3 sm:p-4">
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
              No pending leave requests
            </p>
          </TabsContent>

          <TabsContent value="approved" className="p-3 sm:p-4">
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
              No approved leave requests
            </p>
          </TabsContent>

          <TabsContent value="rejected" className="p-3 sm:p-4">
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
              No rejected leave requests
            </p>
          </TabsContent>

          <TabsContent value="all" className="p-3 sm:p-4">
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
              No leave requests found
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      <LeaveRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmitLeaveRequest}
      />
    </div>
  );
}
