"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addEmployee } from "@/app/actions/employee-actions";
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
  DialogTrigger,
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
  Plus,
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

interface AddEmployeeDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddEmployeeDialog({
  isOpen = false,
  onOpenChange,
  onSuccess,
}: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(isOpen);

  // Sync the internal state with the external state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [role, setRole] = useState<UserRole>(UserRole.Employee);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  const [state, setState] = useState<{ errors?: Record<string, string> }>({
    errors: {},
  });
  const [isPending, setIsPending] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setIsSubmitted(false);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await handleSubmit(state, formData);
      setState((prev) => ({ ...prev, ...result }));

      if (result?.success) {
        setIsSubmitted(true);
        formRef.current?.reset();
        setPreviewUrl("");
        setDate(new Date());
        setRole(UserRole.Employee);

        // Close the dialog after 2 seconds
        setTimeout(() => {
          setOpen(false);
          setIsSubmitted(false);
        }, 2000);
      }

      return result;
    } catch (error) {
      console.error("Form submission error:", error);
      setState((prev) => ({
        ...prev,
        success: false,
        message: "An error occurred while submitting the form",
        errors: { _form: "An unexpected error occurred. Please try again." },
      }));
      return null;
    } finally {
      setIsPending(false);
    }
  };

  async function handleSubmit(prevState: any, formData: FormData) {
    // Add the date and role to the form data
    if (date) {
      formData.set("joinDate", date.toISOString());
    }
    formData.set("role", role);

    try {
      const result = await addEmployee(prevState, formData);
      if (result.success) {
        toast.success("Employee added successfully!");
        setOpen(false);
        setDate(new Date());
        setRole(UserRole.Employee);
        setPreviewUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onSuccess?.();
      } else {
        toast.error(
          result.message || "Failed to add employee. Please try again.",
        );
      }
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        "An error occurred while adding the employee. Please try again.",
      );
      return {
        success: false,
        message: "An error occurred while submitting the form",
        errors: { _form: "An unexpected error occurred. Please try again." },
      };
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        handleOpenChange(isOpen);
        if (!isOpen) {
          // Reset form when dialog is closed
          formRef.current?.reset();
          setPreviewUrl("");
          setDate(new Date());
          setRole(UserRole.Employee);
          setState({ errors: {} });
          setIsSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Employee Added Successfully!
            </h3>
            <p className="text-sm text-muted-foreground">
              The new employee has been added to the system.
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleFormSubmit}
            className="space-y-4"
            noValidate
          >
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold">
                Add New Employee
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Fill in the employee details below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label
                  htmlFor="employeeId"
                  className="text-left sm:text-right sm:pt-2"
                >
                  Employee ID
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    id="employeeId"
                    name="employeeId"
                    className="w-full"
                    placeholder="MOT-00001"
                    required
                  />
                  {state?.errors?.employeeId && (
                    <p className="text-sm text-destructive mt-1">
                      {state.errors.employeeId}
                    </p>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label
                  htmlFor="name"
                  className="text-left sm:text-right sm:pt-2"
                >
                  Full Name
                </Label>
                <div className="sm:col-span-3">
                  <Input id="name" name="name" className="w-full" required />
                  {state?.errors?.name && (
                    <p className="text-sm text-destructive mt-1">
                      {state.errors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Join Date */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label className="text-left sm:text-right sm:pt-2">
                  Join Date
                </Label>
                <div className="sm:col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
              </div>

              {/* Department */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label
                  htmlFor="department"
                  className="text-left sm:text-right sm:pt-2"
                >
                  Department
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    id="department"
                    name="department"
                    className="w-full"
                    required
                  />
                  {state?.errors?.department && (
                    <p className="text-sm text-destructive mt-1">
                      {state.errors.department}
                    </p>
                  )}
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label
                  htmlFor="position"
                  className="text-left sm:text-right sm:pt-2"
                >
                  Position
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    id="position"
                    name="position"
                    className="w-full"
                    required
                  />
                  {state?.errors?.position && (
                    <p className="text-sm text-destructive mt-1">
                      {state.errors.position}
                    </p>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label
                  htmlFor="role"
                  className="text-left sm:text-right sm:pt-2"
                >
                  Role
                </Label>
                <div className="sm:col-span-3">
                  <Select
                    name="role"
                    value={role}
                    onValueChange={(value: UserRole) => setRole(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((roleValue) => (
                        <SelectItem key={roleValue} value={roleValue}>
                          {roleValue.charAt(0).toUpperCase() +
                            roleValue.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Contact Information</h4>

                {/* Email */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Label
                    htmlFor="email"
                    className="text-left sm:text-right sm:pt-2"
                  >
                    Email
                  </Label>
                  <div className="sm:col-span-3">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full"
                      required
                    />
                    {state?.errors?.email && (
                      <p className="text-sm text-destructive mt-1">
                        {state.errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Label
                    htmlFor="phone"
                    className="text-left sm:text-right sm:pt-2"
                  >
                    Phone
                  </Label>
                  <div className="sm:col-span-3">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="w-full"
                      required
                    />
                    {state?.errors?.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {state.errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Label
                    htmlFor="address"
                    className="text-left sm:text-right sm:pt-2"
                  >
                    Address
                  </Label>
                  <div className="sm:col-span-3">
                    <Textarea
                      id="address"
                      name="address"
                      className="w-full min-h-[100px]"
                      required
                    />
                    {state?.errors?.address && (
                      <p className="text-sm text-destructive mt-1">
                        {state.errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label className="text-left sm:text-right sm:pt-2">
                  Profile Photo
                </Label>
                <div className="sm:col-span-3 space-y-2">
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
                        onClick={() => {
                          setPreviewUrl(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="absolute -right-2 -top-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* File Input */}
                  <label
                    htmlFor="profilePhoto"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer 
                      bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 
                      transition-colors duration-200"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">
                          {previewUrl ? "Change photo" : "Click to upload"}
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="profilePhoto"
                      name="profilePhoto"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPreviewUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      ref={fileInputRef}
                    />
                  </label>
                  {state?.errors?.profilePhoto && (
                    <p className="text-sm text-destructive mt-1">
                      {state.errors.profilePhoto}
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label
                  htmlFor="password"
                  className="text-left sm:text-right sm:pt-2"
                >
                  Password
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    className="w-full"
                    placeholder="••••••••"
                    required
                  />
                  {state?.errors?.password && (
                    <p className="text-sm text-destructive mt-1">
                      {state.errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save"
      )}
    </Button>
  );
}
