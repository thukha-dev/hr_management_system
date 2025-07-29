"use client";

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addEmployee } from '@/app/actions/employee-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, CheckCircle2, Loader2, Plus, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';
import Image from 'next/image';

interface AddEmployeeDialogProps {
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ onSuccess }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [role, setRole] = useState<UserRole>(UserRole.Employee);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [state, setState] = useState<{ errors?: Record<string, string> }>({ errors: {} });
  const [isPending, setIsPending] = useState(false);
  
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setIsSubmitted(false);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await handleSubmit(state, formData);
      setState(prev => ({ ...prev, ...result }));
      
      if (result?.success) {
        setIsSubmitted(true);
        formRef.current?.reset();
        setPreviewUrl('');
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
      console.error('Form submission error:', error);
      setState(prev => ({
        ...prev,
        success: false,
        message: 'An error occurred while submitting the form',
        errors: { _form: 'An unexpected error occurred. Please try again.' }
      }));
      return null;
    } finally {
      setIsPending(false);
    }
  };

  async function handleSubmit(prevState: any, formData: FormData) {
    // Add the date and role to the form data
    if (date) {
      formData.set('joinDate', date.toISOString());
    }
    formData.set('role', role);
    
    try {
      const result = await addEmployee(prevState, formData);
      if (result.success) {
        setOpen(false);
        setDate(new Date());
        setRole(UserRole.Employee);
        setPreviewUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSuccess?.();
      }
      return result;
    } catch (error) {
      console.error('Error submitting form:', error);
      return {
        success: false,
        message: 'An error occurred while submitting the form',
        errors: { _form: 'An unexpected error occurred. Please try again.' }
      };
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        // Reset form when dialog is closed
        formRef.current?.reset();
        setPreviewUrl('');
        setDate(new Date());
        setRole(UserRole.Employee);
        setState({ errors: {} });
        setIsSubmitted(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Employee Added Successfully!</h3>
            <p className="text-sm text-muted-foreground">The new employee has been added to the system.</p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold">Add New Employee</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Fill in the employee details below
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              {/* Employee ID */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employeeId" className="text-right">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  name="employeeId"
                  className="col-span-3"
                  placeholder="MOT-00001"
                  required
                />
                {state?.errors?.employeeId && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors.employeeId}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  required
                />
                {state?.errors?.name && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors.name}
                  </p>
                )}
              </div>

              {/* Join Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Join Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
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
                <input type="hidden" name="joinDate" value={date?.toISOString()} />
              </div>

              {/* Department */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  className="col-span-3"
                  required
                />
                {state?.errors?.department && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors.department}
                  </p>
                )}
              </div>

              {/* Position */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">
                  Position
                </Label>
                <Input
                  id="position"
                  name="position"
                  className="col-span-3"
                  required
                />
                {state?.errors?.position && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors.position}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  name="role"
                  value={role}
                  onValueChange={(value: UserRole) => setRole(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map((roleValue) => (
                      <SelectItem key={roleValue} value={roleValue}>
                        {roleValue.charAt(0).toUpperCase() + roleValue.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Info */}
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
                    className="col-span-3"
                    required
                  />
                  {state?.errors?.email && (
                    <p className="col-span-4 text-right text-sm text-destructive">
                      {state.errors.email}
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
                    className="col-span-3"
                    required
                  />
                  {state?.errors?.phone && (
                    <p className="col-span-4 text-right text-sm text-destructive">
                      {state.errors.phone}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="address" className="text-right mt-2">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    className="col-span-3 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                  {state?.errors?.address && (
                    <p className="col-span-4 text-right text-sm text-destructive">
                      {state.errors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Photo */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profilePhoto" className="text-right">
                  Profile Photo
                </Label>
                <div className="col-span-3">
                  <label
                    htmlFor="profilePhoto"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input 
                      id="profilePhoto" 
                      name="profilePhoto" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                    />
                  </label>
                </div>
                {state?.errors?.profilePhoto && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors.profilePhoto}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="col-span-3"
                  placeholder="••••••••"
                  required
                />
                {state?.errors?.password && (
                  <p className="col-span-4 text-right text-sm text-destructive">
                    {state.errors.password}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <SubmitButton />
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
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}
