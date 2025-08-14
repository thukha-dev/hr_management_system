"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import Image from "next/image";
import { toast } from "sonner";
import { MaterialStatus, BankProvider, UserRole } from "@/types/interface";

// Define form schema for validation
const employeeFormSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  nrc: z.string().min(1, "NRC is required"),
  joinDate: z.date(),
  joinMonth: z.string().optional(),
  materialStatus: z.enum(MaterialStatus).optional(),
  salaryProbation: z.number().optional(),
  salary: z.number().min(0, "Salary must be a positive number").optional(),
  birthMonth: z.string().optional(),
  realBirthDate: z.date().optional(),
  nrcBirthDate: z.date().optional(),
  bankProvider: z.enum(BankProvider).optional(),
  bankAccountNumber: z.string().optional(),
  contractDate: z.date().optional(),
  contractByName: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  role: z.enum(UserRole),
  workLocation: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  status: z.string().optional(),
  profilePhoto: z.any().optional(),
  contactInfo: z
    .object({
      email: z.email("Invalid contact email").optional(),
      phone: z.string().optional(),
      parentContactPhone: z.string().optional(),
      currentAddress: z.string().optional(),
      permanentAddress: z.string().optional(),
    })
    .optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EditEmployeeDialogProps {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    nrc: string;
    joinDate: string;
    joinMonth?: string;
    materialStatus?: MaterialStatus;
    salaryProbation?: number;
    salary?: number;
    birthMonth?: string;
    realBirthDate?: string;
    nrcBirthDate?: string;
    bankProvider?: BankProvider;
    bankAccountNumber?: string;
    contractDate?: string;
    contractByName?: string;
    department: string;
    position: string;
    role: UserRole;
    workLocation?: string;
    phone: string;
    address?: string;
    status?: string;
    profilePhoto?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      parentContactPhone?: string;
      currentAddress?: string;
      permanentAddress?: string;
    };
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEmployeeDialog({
  employee,
  isOpen = false,
  onOpenChange,
  onSuccess,
}: EditEmployeeDialogProps) {
  const [open, setOpen] = useState(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    employee.profilePhoto || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      ...employee,
      joinDate: employee.joinDate ? new Date(employee.joinDate) : new Date(),
      realBirthDate: employee.realBirthDate
        ? new Date(employee.realBirthDate)
        : undefined,
      nrcBirthDate: employee.nrcBirthDate
        ? new Date(employee.nrcBirthDate)
        : undefined,
      contractDate: employee.contractDate
        ? new Date(employee.contractDate)
        : undefined,
      contactInfo: {
        email: employee.contactInfo?.email || employee.email,
        phone: employee.contactInfo?.phone || employee.phone,
        parentContactPhone: employee.contactInfo?.parentContactPhone || "",
        currentAddress:
          employee.contactInfo?.currentAddress || employee.address || "",
        permanentAddress:
          employee.contactInfo?.permanentAddress || employee.address || "",
      },
    },
  });

  // Sync the open state with the parent
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Update form values when employee prop changes
  useEffect(() => {
    if (employee) {
      reset({
        ...employee,
        joinDate: employee.joinDate ? new Date(employee.joinDate) : new Date(),
        realBirthDate: employee.realBirthDate
          ? new Date(employee.realBirthDate)
          : undefined,
        nrcBirthDate: employee.nrcBirthDate
          ? new Date(employee.nrcBirthDate)
          : undefined,
        contractDate: employee.contractDate
          ? new Date(employee.contractDate)
          : undefined,
        contactInfo: {
          email: employee.contactInfo?.email || employee.email,
          phone: employee.contactInfo?.phone || employee.phone,
          parentContactPhone: employee.contactInfo?.parentContactPhone || "",
          currentAddress:
            employee.contactInfo?.currentAddress || employee.address || "",
          permanentAddress:
            employee.contactInfo?.permanentAddress || employee.address || "",
        },
      });
      setPreviewUrl(employee.profilePhoto || null);
    }
  }, [employee, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      setValue("profilePhoto", file as any);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setValue("profilePhoto", undefined);
  };

  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    try {
      setIsSubmitting(true);

      // Handle file upload if there's a new profile photo
      let profilePhotoUrl = employee.profilePhoto;

      if (data.profilePhoto && data.profilePhoto instanceof File) {
        try {
          const formData = new FormData();
          formData.append("file", data.profilePhoto);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload profile photo");
          }

          const uploadResult = await uploadResponse.json();
          profilePhotoUrl = uploadResult.url;
        } catch (error) {
          console.error("Error uploading profile photo:", error);
          toast.error("Failed to upload profile photo. Using previous image.");
        }
      }

      // Prepare the employee data for update
      const employeeData = {
        ...data,
        id: employee.id,
        profilePhoto: profilePhotoUrl,
        joinDate: data.joinDate.toISOString(),
        realBirthDate: data.realBirthDate?.toISOString(),
        nrcBirthDate: data.nrcBirthDate?.toISOString(),
        contractDate: data.contractDate?.toISOString(),
      };

      // Remove the file from the data to be sent
      delete (employeeData as any).profilePhotoFile;

      // Send the update request
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update employee");
      }

      toast.success("Employee updated successfully!");
      onSuccess?.();

      // Close the dialog after a short delay
      setTimeout(() => {
        onOpenChange?.(false);
      }, 1500);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update employee",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold">
              Edit Employee
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the employee details below
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
            <div className="flex gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="employeeId" className="sm:pt-2">
              Employee ID
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="employeeId"
                placeholder="Enter employee ID"
                {...register("employeeId")}
              />
              {errors.employeeId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.employeeId.message}
                </p>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="name" className="sm:pt-2">
              Full Name
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="name"
                placeholder="Enter full name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Department */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="department" className="sm:pt-2">
              Department
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="department"
                placeholder="Enter department"
                {...register("department")}
              />
              {errors.department && (
                <p className="text-sm text-destructive mt-1">
                  {errors.department.message}
                </p>
              )}
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="position" className="sm:pt-2">
              Position
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="position"
                placeholder="Enter position"
                {...register("position")}
              />
              {errors.position && (
                <p className="text-sm text-destructive mt-1">
                  {errors.position.message}
                </p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label className="sm:pt-2">Role</Label>
            <div className="sm:col-span-3">
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label className="sm:pt-2">Status</Label>
            <div className="sm:col-span-3">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Join Date and Join Month */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label className="sm:pt-2">Join Date</Label>
            <div className="sm:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Controller
                    control={control}
                    name="joinDate"
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
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.joinDate && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.joinDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    id="joinMonth"
                    placeholder="e.g., January 2023"
                    {...register("joinMonth")}
                  />
                  {errors.joinMonth && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.joinMonth.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Material Status and Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label className="sm:pt-2">Material Status</Label>
            <div className="sm:col-span-3">
              <Controller
                name="materialStatus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MaterialStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="salary" className="sm:pt-2">
              Salary
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="salary"
                type="number"
                placeholder="Enter salary"
                {...register("salary", { valueAsNumber: true })}
              />
              {errors.salary && (
                <p className="text-sm text-destructive mt-1">
                  {errors.salary.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="salaryProbation" className="sm:pt-2">
              Probation Salary
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="salaryProbation"
                type="number"
                placeholder="Enter probation salary"
                {...register("salaryProbation", { valueAsNumber: true })}
              />
              {errors.salaryProbation && (
                <p className="text-sm text-destructive mt-1">
                  {errors.salaryProbation.message}
                </p>
              )}
            </div>
          </div>

          {/* Birth Information */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label className="sm:pt-2">Birth Information</Label>
            <div className="sm:col-span-3 space-y-4">
              <Input
                id="birthMonth"
                placeholder="e.g., January"
                {...register("birthMonth")}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            initialFocus
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
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
                            initialFocus
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

          {/* Work Location */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="workLocation" className="sm:pt-2">
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
              {errors.workLocation && (
                <p className="text-sm text-destructive mt-1">
                  {errors.workLocation.message}
                </p>
              )}
            </div>
          </div>

          {/* NRC Number */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="nrc" className="sm:pt-2">
              NRC Number
            </Label>
            <div className="sm:col-span-3">
              <Input
                id="nrc"
                placeholder="e.g., 12/ABC(N)123456"
                {...register("nrc")}
              />
              {errors.nrc && (
                <p className="text-sm text-destructive mt-1">
                  {errors.nrc.message}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
            <Label htmlFor="address" className="sm:pt-2">
              Address
            </Label>
            <div className="sm:col-span-3">
              <Textarea
                id="address"
                placeholder="Enter full address"
                className="min-h-[80px]"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Contact Information</h4>

            {/* Contact Email */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
              <Label htmlFor="contactInfo.email" className="sm:pt-2">
                Contact Email
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="contactInfo.email"
                  type="email"
                  placeholder="Enter contact email"
                  {...register("contactInfo.email")}
                />
                {errors.contactInfo?.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactInfo.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
              <Label htmlFor="contactInfo.phone" className="sm:pt-2">
                Contact Phone
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="contactInfo.phone"
                  placeholder="Enter contact phone"
                  {...register("contactInfo.phone")}
                />
                {errors.contactInfo?.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactInfo.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Parent/Guardian Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
              <Label
                htmlFor="contactInfo.parentContactPhone"
                className="sm:pt-2"
              >
                Parent/Guardian Phone
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="contactInfo.parentContactPhone"
                  placeholder="Enter parent/guardian phone"
                  {...register("contactInfo.parentContactPhone")}
                />
                {errors.contactInfo?.parentContactPhone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactInfo.parentContactPhone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Current Address */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
              <Label htmlFor="contactInfo.currentAddress" className="sm:pt-2">
                Current Address
              </Label>
              <div className="sm:col-span-3">
                <Textarea
                  id="contactInfo.currentAddress"
                  placeholder="Enter current address"
                  className="min-h-[80px]"
                  {...register("contactInfo.currentAddress")}
                />
                {errors.contactInfo?.currentAddress && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactInfo.currentAddress.message}
                  </p>
                )}
              </div>
            </div>

            {/* Permanent Address */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
              <Label htmlFor="contactInfo.permanentAddress" className="sm:pt-2">
                Permanent Address
              </Label>
              <div className="sm:col-span-3">
                <Textarea
                  id="contactInfo.permanentAddress"
                  placeholder="Enter permanent address"
                  className="min-h-[80px]"
                  {...register("contactInfo.permanentAddress")}
                />
                {errors.contactInfo?.permanentAddress && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.contactInfo.permanentAddress.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Update Employee
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditEmployeeDialog;
