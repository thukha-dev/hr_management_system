"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Save,
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
import Image from "next/image";
import logger from "@/lib/logger";
import { toast } from "sonner";
import { MaterialStatus, BankProvider, UserRole } from "@/types/interface";

interface FormValues {
  employeeId: string;
  name: string;
  email: string;
  nrc: string;
  joinDate: Date;
  joinMonth: string;
  materialStatus: MaterialStatus;
  salaryProbation: number;
  salary: number;
  birthMonth: string;
  realBirthDate: Date;
  nrcBirthDate: Date;
  bankProvider: BankProvider;
  bankAccountNumber: string;
  contractDate: Date;
  contractByName: string;
  department: string;
  position: string;
  role: UserRole;
  workLocation: string;
  phone: string;
  address: string;
  password: string;
  status?: string;
  profilePhoto?: FileList;
  contactInfo: {
    email: string;
    phone?: string;
    parentContactPhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
  };
}

export function AddEmployeeDialog({
  isOpen = false,
  onOpenChange,
  onSuccess,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(isOpen);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      role: UserRole.Employee,
      materialStatus: MaterialStatus.Single,
      workLocation: "OFFICE",
      joinDate: new Date(),
    },
  });

  useEffect(() => setOpen(isOpen), [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      reset();
      setPreviewUrl(null);
      setIsSubmitted(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      setValue("profilePhoto", e.target.files as FileList);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setValue("profilePhoto", undefined);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();

      // Prepare the employee data object with proper typing
      interface EmployeeData {
        employeeId: string;
        name: string;
        email: string;
        password: string;
        nrc: string;
        joinDate: string | Date;
        joinMonth: string;
        materialStatus: MaterialStatus;
        salaryProbation: number;
        salary: number;
        birthMonth: string;
        realBirthDate: string | Date;
        nrcBirthDate: string | Date;
        bankProvider: BankProvider;
        bankAccountNumber: string;
        contractDate: string | Date;
        contractByName: string;
        department: string;
        position: string;
        role: UserRole;
        workLocation: string;
        phone: string;
        address: string;
        status: string;
        profilePhoto?: string;
        contactInfo: {
          email: string;
          phone?: string;
          parentContactPhone?: string;
          currentAddress?: string;
          permanentAddress?: string;
        };
      }

      // Create employee data with proper typing
      const employeeData: EmployeeData = {
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        password: data.password,
        nrc: data.nrc,
        joinDate: data.joinDate,
        joinMonth: data.joinMonth,
        materialStatus: data.materialStatus,
        salaryProbation: data.salaryProbation,
        salary: data.salary,
        birthMonth: data.birthMonth,
        realBirthDate: data.realBirthDate,
        nrcBirthDate: data.nrcBirthDate,
        bankProvider: data.bankProvider,
        bankAccountNumber: data.bankAccountNumber,
        contractDate: data.contractDate,
        contractByName: data.contractByName,
        department: data.department,
        position: data.position,
        role: data.role,
        workLocation: data.workLocation,
        phone: data.phone,
        address: data.address,
        status: data.status || "active",
        contactInfo: {
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          parentContactPhone: data.contactInfo.parentContactPhone,
          currentAddress: data.contactInfo.currentAddress,
          permanentAddress: data.contactInfo.permanentAddress,
        },
      };

      // Process dates to ISO strings
      const dateFields: (keyof EmployeeData)[] = [
        "joinDate",
        "realBirthDate",
        "nrcBirthDate",
        "contractDate",
      ];

      dateFields.forEach((key) => {
        const value = employeeData[key];
        if (value instanceof Date) {
          (employeeData as any)[key] = value.toISOString();
        } else if (value && typeof value === "string") {
          // If it's already a string, ensure it's in ISO format
          try {
            (employeeData as any)[key] = new Date(value).toISOString();
          } catch (e) {
            console.warn(`Invalid date format for field ${key}:`, value);
          }
        }
      });

      // Handle file upload if exists
      if (data.profilePhoto && data.profilePhoto.length > 0) {
        formData.append("file", data.profilePhoto[0]);
      } else {
        // Set a default empty string if no photo is provided
        employeeData.profilePhoto = "";
      }

      // Add the JSON data as a field
      formData.append("data", JSON.stringify(employeeData));

      const response = await fetch("/api/employees", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      logger.info("API response:", result);

      if (response.ok) {
        toast.success("Employee added successfully!");
        setIsSubmitted(true);
        reset();
        setPreviewUrl(null);

        setTimeout(() => {
          setOpen(false);
          setIsSubmitted(false);
          onSuccess?.();
        }, 2000);
      } else {
        // Handle API errors
        const errorMessage =
          result.error || result.message || "Failed to add employee";
        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-center">
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
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
            onSubmit={handleSubmit(onSubmit)}
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

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Profile preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-xs">PNG, JPG (MAX. 5MB)</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="employeeId" className=" sm:pt-2">
                Employee ID
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="employeeId"
                  placeholder="Enter employee ID"
                  {...register("employeeId", {
                    required: "Employee ID is required",
                  })}
                />
                {errors.employeeId && (
                  <p className="text-sm text-destructive">
                    {errors.employeeId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="name" className=" sm:pt-2">
                Full Name
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="name"
                  placeholder="Enter full name"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* NRC */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="nrc" className=" sm:pt-2">
                NRC Number
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="nrc"
                  placeholder="e.g., 12/ABC(N)123456"
                  {...register("nrc", {
                    required: "NRC is required",
                    pattern: {
                      value: /^[0-9]{1,2}\/[A-Za-z]{1,3}\([A-Za-z]\)[0-9]{6}$/,
                      message: "Invalid NRC format",
                    },
                  })}
                />
                {errors.nrc && (
                  <p className="text-sm text-destructive">
                    {errors.nrc.message}
                  </p>
                )}
              </div>
            </div>

            {/* Join Date */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label className=" sm:pt-2">Join Date</Label>
              <div className="sm:col-span-3">
                <Controller
                  control={control}
                  name="joinDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>

            {/* Join Month */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="joinMonth" className=" sm:pt-2">
                Join Month
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="joinMonth"
                  placeholder="e.g., January 2025"
                  {...register("joinMonth", {
                    required: "Join Month is required",
                  })}
                />
                {errors.joinMonth && (
                  <p className="text-sm text-destructive">
                    {errors.joinMonth.message}
                  </p>
                )}
              </div>
            </div>

            {/* Material Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="materialStatus" className=" sm:pt-2">
                Material Status
              </Label>
              <div className="sm:col-span-3">
                <Controller
                  control={control}
                  name="materialStatus"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MaterialStatus).map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.materialStatus && (
                  <p className="text-sm text-destructive">
                    {errors.materialStatus.message}
                  </p>
                )}
              </div>
            </div>

            {/* Salary Probation */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="salaryProbation" className=" sm:pt-2">
                Salary Probation (MMK)
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="salaryProbation"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter amount in MMK"
                  {...register("salaryProbation", {
                    required: "Salary Probation is required",
                    valueAsNumber: true,
                    validate: (value) =>
                      Number.isInteger(Number(value)) ||
                      "Must be a whole number",
                  })}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {errors.salaryProbation && (
                  <p className="text-sm text-destructive">
                    {errors.salaryProbation.message}
                  </p>
                )}
              </div>
            </div>

            {/* Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="salary" className=" sm:pt-2">
                Salary (MMK)
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter amount in MMK"
                  {...register("salary", {
                    required: "Salary is required",
                    valueAsNumber: true,
                    validate: (value) =>
                      Number.isInteger(Number(value)) ||
                      "Must be a whole number",
                  })}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {errors.salary && (
                  <p className="text-sm text-destructive">
                    {errors.salary.message}
                  </p>
                )}
              </div>
            </div>

            {/* Birth Information */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label className="sm:pt-2">Birth Information</Label>
              <div className="sm:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Real Birth Date</Label>
                    <Controller
                      control={control}
                      name="realBirthDate"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                  <div>
                    <Label>NRC Birth Date</Label>
                    <Controller
                      control={control}
                      name="nrcBirthDate"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Birth Month</Label>
                    <Input
                      id="birthMonth"
                      placeholder="e.g., January"
                      {...register("birthMonth")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label className="sm:pt-2">Bank Information</Label>
              <div className="sm:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Controller
                      name="bankProvider"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(BankProvider).map((bank) => (
                              <SelectItem key={bank} value={bank}>
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Input
                      id="bankAccountNumber"
                      placeholder="Account number"
                      {...register("bankAccountNumber")}
                    />
                    {errors.bankAccountNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.bankAccountNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label className="sm:pt-2">Contract Information</Label>
              <div className="sm:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Controller
                      control={control}
                      name="contractDate"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Contract date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                  <div>
                    <Input
                      id="contractByName"
                      placeholder="Contract by name"
                      {...register("contractByName")}
                    />
                    {errors.contractByName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.contractByName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="department" className=" sm:pt-2">
                Department
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="department"
                  placeholder="Enter department name"
                  {...register("department", {
                    required: "Department is required",
                  })}
                />
                {errors.department && (
                  <p className="text-sm text-destructive">
                    {errors.department.message}
                  </p>
                )}
              </div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="position" className=" sm:pt-2">
                Position
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="position"
                  placeholder="Enter position title"
                  {...register("position", {
                    required: "Position is required",
                  })}
                />
                {errors.position && (
                  <p className="text-sm text-destructive">
                    {errors.position.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="role" className=" sm:pt-2">
                Role
              </Label>
              <div className="sm:col-span-3">
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(UserRole).map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Work Location */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="workLocation" className=" sm:pt-2">
                Work Location
              </Label>
              <div className="sm:col-span-3">
                <Controller
                  control={control}
                  name="workLocation"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="WFH">Work From Home</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Contact Information</h4>

              {/* Email */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                <Label htmlFor="email" className=" sm:pt-2">
                  Email
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    type="email"
                    placeholder="employee@company.com"
                    {...register("contactInfo.email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-destructive">
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                <Label htmlFor="phone" className=" sm:pt-2">
                  Phone
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    type="tel"
                    placeholder="09XXXXXXXX"
                    {...register("contactInfo.phone", {
                      required: "Phone is required",
                    })}
                  />
                  {errors.contactInfo?.phone && (
                    <p className="text-sm text-destructive">
                      {errors.contactInfo.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Parent Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                <Label htmlFor="parentContactPhone" className=" sm:pt-2">
                  Parent/Guardian Phone
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    type="tel"
                    placeholder="09XXXXXXXX"
                    {...register("contactInfo.parentContactPhone", {
                      required: "Parent Contact Phone is required",
                    })}
                  />
                  {errors.contactInfo?.parentContactPhone && (
                    <p className="text-sm text-destructive">
                      {errors.contactInfo?.parentContactPhone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Current Address */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                <Label htmlFor="currentAddress" className=" sm:pt-2">
                  Current Address
                </Label>
                <div className="sm:col-span-3">
                  <Textarea
                    placeholder="Enter current address"
                    {...register("contactInfo.currentAddress", {
                      required: "Current Address is required",
                    })}
                  />
                  {errors.contactInfo?.currentAddress && (
                    <p className="text-sm text-destructive">
                      {errors.contactInfo?.currentAddress.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Permanent Address */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                <Label htmlFor="permanentAddress" className=" sm:pt-2">
                  Permanent Address
                </Label>
                <div className="sm:col-span-3">
                  <Textarea
                    placeholder="Enter permanent address"
                    {...register("contactInfo.permanentAddress", {
                      required: "Permanent Address is required",
                    })}
                  />
                  {errors.contactInfo?.permanentAddress && (
                    <p className="text-sm text-destructive">
                      {errors.contactInfo?.permanentAddress.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <Label htmlFor="password" className=" sm:pt-2">
                Password
              </Label>
              <div className="sm:col-span-3">
                <Input
                  type="password"
                  placeholder="Enter a strong password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
