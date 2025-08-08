import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function LeaveRequestForm() {
  const [form, setForm] = useState({
    type: "",
    date: undefined as Date | undefined,
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSelectChange(value: string) {
    setForm({ ...form, type: value });
  }

  function handleDateSelect(date: Date | undefined) {
    setForm({ ...form, date });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setForm({ type: "", date: undefined, reason: "" });
    }, 800);
  }

  return (
    <Card className="shadow-lg border border-muted bg-background">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
            <Label
              htmlFor="leaveType"
              className="text-left md:text-right md:pt-2 font-medium"
            >
              Leave Type
            </Label>
            <div className="md:col-span-3">
              <Select value={form.type} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full" aria-label="Leave Type">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
            <Label className="text-left md:text-right md:pt-2 font-medium">
              Leave Date
            </Label>
            <div className="md:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? (
                      format(form.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={handleDateSelect}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
            <Label
              htmlFor="reason"
              className="text-left md:text-right md:pt-2 font-medium"
            >
              Reason
            </Label>
            <div className="md:col-span-3">
              <Textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Reason for leave"
                required
                className="resize-none min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:justify-end gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto text-base py-2"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
          {submitted && (
            <div className="text-green-600 mt-2 text-center font-medium">
              Leave request submitted!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
