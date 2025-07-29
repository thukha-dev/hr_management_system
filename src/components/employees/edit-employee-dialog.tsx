"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateEmployee } from "@/app/actions/employee-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types/auth";
import Image from "next/image";
import { toast } from "sonner";

interface EditEmployeeDialogProps {
  employee: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    position: string;
    status: string;
    joinDate: string;
    phone?: string;
    address?: string;
    profilePhoto?: string;
    contactInfo?: {
      email: string;
      phone?: string;
      address?: string;
      [key: string]: any;
    };
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditEmployeeDialog({
  employee,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditEmployeeDialogProps) {
  const [date, setDate] = useState<Date | undefined>(
    employee ? new Date(employee.joinDate) : new Date(),
  );
  // Map the status to a valid UserRole, defaulting to Employee if not found
  const getValidRole = (status: string): UserRole => {
    const role = Object.values(UserRole).find((role) => role === status);
    return role || UserRole.Employee;
  };

  const [role, setRole] = useState<UserRole>(
    employee ? getValidRole(employee.status) : UserRole.Employee,
  );
  const [previewUrl, setPreviewUrl] = useState<string>(
    employee?.profilePhoto || "",
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Define the form state type
  interface FormState {
    success: boolean;
    message?: string;
    errors?: {
      _form?: string;
      [key: string]: any;
    };
  }

  const [state, setState] = useState<FormState>({
    success: false,
    message: undefined,
    errors: {},
  });
  const [isPending, setIsPending] = useState(false);

  // Get contact info with fallbacks
  // const contactInfo = employee?.contactInfo || {};
  const email = employee?.contactInfo?.email || "";
  const phone = employee?.contactInfo?.phone || "";
  const address = employee?.contactInfo?.address || "";

  console.log("employee is --- ", employee);

  // Handle dialog open/close state changes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && employee) {
      formRef.current?.reset();
      setPreviewUrl(employee.profilePhoto || "");
      setDate(employee.joinDate ? new Date(employee.joinDate) : new Date());
      setRole(getValidRole(employee.status));
      setState({
        success: false,
        message: undefined,
        errors: {},
      });
      setIsSubmitted(false);
    }
  };

  useEffect(() => {
    if (employee) {
      setDate(employee.joinDate ? new Date(employee.joinDate) : new Date());
      setRole(getValidRole(employee.status));
      setPreviewUrl(employee.profilePhoto || "");
    }
  }, [employee]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employee) return;

    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    // Add the date and role to the form data
    if (date) {
      formData.set("joinDate", date.toISOString());
    }
    formData.set("role", role);

    try {
      const result = await updateEmployee(employee.id, formData);

      if (result?.success) {
        setIsSubmitted(true);
        onSuccess();

        // Close the dialog after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
          setIsSubmitted(false);
        }, 2000);
      } else {
        const errorState: FormState = {
          success: false,
          message: result?.message || "Failed to update employee",
          errors: {
            _form: result?.message || "An error occurred",
          },
        };
        setState(errorState);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      const errorState: FormState = {
        success: false,
        message: "An error occurred while updating the employee",
        errors: { _form: "An unexpected error occurred. Please try again." },
      };
      setState(errorState);
    } finally {
      setIsPending(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Employee Updated Successfully!
            </h3>
            <p className="text-sm text-muted-foreground">
              The employee details have been updated.
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update the employee details below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Employee ID */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employeeId" className="text-right">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  name="employeeId"
                  defaultValue={employee.employeeId}
                  className="col-span-3"
                  disabled
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={employee.name}
                  className="col-span-3"
                  required
                />
                {state?.errors?.name && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors?.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  defaultValue={employee.department}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">
                  Position
                </Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={employee.position}
                  className="col-span-3"
                  required
                />
              </div>

              {/* Role */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Role
                </Label>
                <Select
                  name="status"
                  value={role}
                  onValueChange={(value: UserRole) => setRole(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map((roleValue) => (
                      <SelectItem key={roleValue} value={roleValue}>
                        {roleValue.charAt(0).toUpperCase() +
                          roleValue.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Join Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Join Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <input
                  type="hidden"
                  name="joinDate"
                  value={date?.toISOString()}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Contact Information</h4>

                {/* Email */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={email}
                    className="col-span-3"
                    required
                  />
                  {state?.errors?.email && (
                    <p className="col-span-4 text-right text-sm text-destructive">
                      {state.errors?.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={phone}
                    className="col-span-3"
                  />
                </div>

                {/* Address */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="address" className="text-right mt-2">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    defaultValue={address}
                    className="col-span-3 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Profile Photo */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profilePhoto" className="text-right">
                  Profile Photo
                </Label>
                <div className="col-span-3">
                  <input
                    type="file"
                    id="profilePhoto"
                    name="profilePhoto"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                      <Image
                        src={previewUrl}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white/90"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="profilePhoto"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          SVG, PNG, JPG or GIF (max. 2MB)
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
