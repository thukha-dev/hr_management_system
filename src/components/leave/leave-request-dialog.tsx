"use client";

import { useState } from "react";
import { CalendarIcon, Clock, Sun, Moon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Radio group for half-day selection
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const leaveTypes = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "half-unpaid", label: "Half Unpaid Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
] as const;

const formSchema = z
  .object({
    leaveType: z.string().min(1, "Please select a leave type"),
    leaveDate: z.date(),
    halfDay: z.enum(["morning", "evening"]).optional(),
    reason: z.string().min(10, "Please provide a reason (min 10 characters)"),
  })
  .refine(
    (data) => {
      if (!data.leaveDate) {
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return data.leaveDate >= today;
    },
    {
      message: "Leave date is required and cannot be in the past",
      path: ["leaveDate"],
    },
  )
  .refine(
    (data) => {
      if (data.leaveType === "unpaid") {
        return data.halfDay !== undefined;
      }
      return true;
    },
    {
      message: "Please select morning or evening",
      path: ["halfDay"],
    },
  );

type LeaveRequestFormValues = z.infer<typeof formSchema>;

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LeaveRequestFormValues) => void;
}

export function LeaveRequestDialog({
  open,
  onOpenChange,
  onSubmit,
}: LeaveRequestDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveType: "",
      reason: "",
      halfDay: undefined,
    },
  });

  const watchLeaveType = form.watch("leaveType");

  const handleSubmit = (values: LeaveRequestFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            Fill out the form to submit a new leave request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="leaveDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Leave Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchLeaveType === "half-unpaid" ||
                watchLeaveType === "unpaid") && (
                <FormField
                  control={form.control}
                  name="halfDay"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select Time</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem
                              value="morning"
                              id="morning"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="morning"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <Sun className="mb-2 h-6 w-6" />
                              <span>Morning</span>
                              <span className="text-sm text-muted-foreground">
                                (9:00 AM - 1:00 PM)
                              </span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="evening"
                              id="evening"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="evening"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <Moon className="mb-2 h-6 w-6" />
                              <span>Evening</span>
                              <span className="text-sm text-muted-foreground">
                                (2:00 PM - 6:00 PM)
                              </span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for your leave request"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a brief explanation for your leave request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
