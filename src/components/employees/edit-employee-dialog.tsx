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
  // Safely extract employee data with defaults
  const employeeData = employee || {
    id: "",
    name: "",
    employeeId: "",
    department: "",
    position: "",
    status: "active",
    joinDate: new Date().toISOString(),
    profilePhoto: "",
    contactInfo: {
      email: "",
      phone: "",
      address: "",
    },
  };

  // Extract contact info with defaults
  const contactInfo = employeeData.contactInfo || {
    email: "",
    phone: "",
    address: "",
  };

  // State for form fields
  const [name, setName] = useState(employeeData.name || "");
  const [department, setDepartment] = useState(employeeData.department || "");
  const [position, setPosition] = useState(employeeData.position || "");
  const [status, setStatus] = useState(employeeData.status || "active");
  const [date, setDate] = useState<Date | undefined>(
    employeeData.joinDate ? new Date(employeeData.joinDate) : new Date(),
  );

  // Helper function to get valid role from status
  const getValidRole = (status: string): UserRole => {
    const role = Object.values(UserRole).find((r) => r === status);
    return role || UserRole.Employee; // Using Employee instead of EMPLOYEE
  };

  const [role, setRole] = useState<UserRole>(
    employeeData.status ? getValidRole(employeeData.status) : UserRole.Employee,
  );

  const [open, setOpen] = useState(isOpen);

  // Sync the internal state with the external state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    employeeData.profilePhoto || null,
  );
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact info with unique variable names to avoid conflicts
  const employeeEmail = contactInfo.email || "";
  const employeePhone = contactInfo.phone || "";
  const employeeAddress = contactInfo.address || "";
  const formRef = useRef<HTMLFormElement>(null);

  // Define the form state type
  interface FormState {
    success: boolean;
    message?: string;
    errors?: Record<string, string>;
  }

  const [formState, setFormState] = useState<FormState>({
    success: false,
    message: "",
    errors: {},
  });

  // Get contact info with fallbacks
  // const contactInfo = employee?.contactInfo || {};
  const email = employee?.contactInfo?.email || "";
  const phone = employee?.contactInfo?.phone || "";
  const address = employee?.contactInfo?.address || "";

  console.log("employee is --- ", employee);

  // Handle dialog open/close state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen && employee) {
      formRef.current?.reset();
      setPreviewUrl(employee.profilePhoto || "");
      setDate(employee.joinDate ? new Date(employee.joinDate) : new Date());
      setRole(getValidRole(employee.status));
      setFormState({
        success: false,
        message: "",
        errors: {},
      });
      setIsSubmitted(false);
    }
  };

  useEffect(() => {
    if (open && employee) {
      setFormState({
        success: false,
        message: "",
        errors: {},
      });
    }
  }, [open, employee]);

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

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!employee) return;

    setIsPending(true);
    setFormState((prev) => ({ ...prev, success: false, message: "" }));

    const formData = new FormData(e.currentTarget);
    if (date) {
      formData.set("joinDate", date.toISOString());
    }
    formData.set("role", role);

    try {
      const result = await updateEmployee(employee.id, formData);

      if (result.success) {
        toast.success("Employee updated successfully!");
        setFormState({
          success: true,
          message: "Employee updated successfully",
        });
        // Close the dialog after 2 seconds
        setTimeout(() => {
          onOpenChange?.(false);
          onSuccess?.();
        }, 2000);
      } else {
        const errorMessage = result.message || "Failed to update employee";
        toast.error(errorMessage);
        setFormState({
          success: false,
          message: errorMessage,
          errors: { _form: errorMessage },
        });
      }
      return result;
    } catch (error) {
      console.error("Error updating employee:", error);
      const errorMessage = "An error occurred while updating the employee";
      toast.error(errorMessage);
      setFormState({
        success: false,
        message: errorMessage,
        errors: { _form: "An unexpected error occurred. Please try again." },
      });
      return null;
    } finally {
      setIsPending(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <Input id="name" className="col-span-3" required />
                {formState.errors?.email && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {formState.errors?.email}
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

              {/* Profile Photo */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">Profile Photo</Label>
                <div className="col-span-3 space-y-2">
                  {/* Image Preview */}
                  {previewUrl && (
                    <div className="relative w-24 h-24 mb-2">
                      <Image
                        src={previewUrl}
                        alt="Profile preview"
                        fill
                        className="rounded-md object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -right-2 -top-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* File Input */}
                  <label
                    htmlFor="profilePhoto"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">
                          {previewUrl ? "Change photo" : "Click to upload"}
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="profilePhoto"
                      name="profilePhoto"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </label>
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
