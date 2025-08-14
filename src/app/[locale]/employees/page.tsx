"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EmployeeDataTable } from "@/components/employees/employee-data-table";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";
import { ImportEmployeesDialog } from "@/components/employees/import-employees-dialog";
import { deleteEmployee } from "@/app/actions/employee-actions";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toPlainObject } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BankProvider, MaterialStatus, UserRole } from "@/types/interface";

// Define the base Employee type based on the API response
type Employee = {
  _id: string;
  id: string; // For backward compatibility
  employeeId: string;
  name: string;
  email?: string; // For backward compatibility
  contactInfo?: {
    email?: string;
    phone?: string;
    parentContactPhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
  };
  department: string;
  position: string;
  joinDate: string;
  joinMonth: string;
  nrc: string;
  materialStatus: MaterialStatus;
  salaryProbation: number;
  salary: number;
  birthMonth: string;
  realBirthDate: string;
  nrcBirthDate: string;
  bankProvider: BankProvider;
  bankAccountNumber: string;
  contractDate: string;
  contractByName: string;
  workLocation: "OFFICE" | "WFH";
  profilePhoto: string;
  role: UserRole;
  status: string; // Made required with a default value
  createdAt?: string;
  updatedAt?: string;
};

// Type for the employee table row that extends the base Employee type
type EmployeeTableRow = Employee & {
  id: string;
  email: string;
  phone: string; // Made required to match EditEmployeeDialog props
  address: string; // Made required to match EditEmployeeDialog props
  contactInfo: {
    email: string;
    phone: string; // Made required to match EditEmployeeDialog props
    parentContactPhone: string; // Made required to match EditEmployeeDialog props
    currentAddress: string; // Made required to match EditEmployeeDialog props
    permanentAddress: string; // Made required to match EditEmployeeDialog props
  };
};

// Helper function to map Employee to EmployeeTableRow
const mapToTableRow = (employee: Employee): EmployeeTableRow => {
  return {
    ...employee,
    id: employee._id || employee.id || "",
    email: employee.email || employee.contactInfo?.email || "",
    phone: employee.contactInfo?.phone || "", // Ensure phone is always a string
    address:
      employee.contactInfo?.currentAddress ||
      employee.contactInfo?.permanentAddress ||
      "",
    contactInfo: {
      email: employee.contactInfo?.email || employee.email || "",
      phone: employee.contactInfo?.phone || "", // Ensure phone is always a string
      parentContactPhone: employee.contactInfo?.parentContactPhone || "",
      currentAddress: employee.contactInfo?.currentAddress || "",
      permanentAddress: employee.contactInfo?.permanentAddress || "",
    },
  };
};

// Skeleton row component
function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeTableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("Employees");

  // Define columns for the data table with proper typing
  const columns: ColumnDef<EmployeeTableRow>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("employeeId")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const avatar =
          row.original.profilePhoto || "/avatars/default-avatar.png";
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
              <img
                src={avatar}
                alt={name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/avatars/default-avatar.png";
                }}
              />
            </div>
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-sm text-gray-500">{row.original.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contactInfo.email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.original.contactInfo?.email;
        return <div className="text-sm">{email || "-"}</div>;
      },
    },
    {
      accessorKey: "contactInfo.phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.contactInfo?.phone;
        return <div className="text-sm">{phone || "-"}</div>;
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => {
        const department = row.getValue("department") as string;
        return <div className="capitalize">{department || "-"}</div>;
      },
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => {
        const position = row.getValue("position") as string;
        return <div>{position || "-"}</div>;
      },
    },
    {
      accessorKey: "workLocation",
      header: "Work Location",
      cell: ({ row }) => {
        const location = row.getValue("workLocation") as string;
        return (
          <div className="text-sm">
            {location === "WFH" ? "Work From Home" : "Office"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div
            className={cn("px-2 py-1 rounded-full text-xs font-medium w-fit", {
              "bg-green-100 text-green-800": status === "active",
              "bg-red-100 text-red-800": status === "inactive",
              "bg-yellow-100 text-yellow-800": status === "on_leave",
            })}
          >
            {status || "active"}
          </div>
        );
      },
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => {
        const date = row.getValue("joinDate") as string;
        return (
          <div className="text-sm whitespace-nowrap">
            {date ? format(new Date(date), "MMM d, yyyy") : "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleEdit(employee)}
                  disabled={isDeleting === employee._id}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(employee._id)}
                  disabled={isDeleting === employee._id}
                  className="text-red-600 focus:text-red-600"
                >
                  {isDeleting === employee._id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Function to fetch employees from the API
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employees", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(errorData.message || "Failed to fetch employees");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("Unexpected API response format:", data);
        throw new Error("Invalid data format received from server");
      }

      // Map the API response to the EmployeeTableRow type
      const mappedEmployees = data.map((emp: Employee) => mapToTableRow(emp));
      setEmployees(mappedEmployees);
      return mappedEmployees;
    } catch (error: unknown) {
      console.error("Error fetching employees:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("errors.fetchFailed");
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Fetch employees on component mount and when fetchEmployees changes
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle edit button click
  const handleEdit = useCallback((employee: EmployeeTableRow) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  }, []);

  // Handle delete button click
  const handleDelete = useCallback((employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm delete action
  const confirmDelete = useCallback(async () => {
    if (!employeeToDelete) return;

    setIsDeleting(employeeToDelete);
    try {
      await deleteEmployee(employeeToDelete);
      toast.success(t("deleteSuccess"));
      setEmployees((prev) =>
        prev.filter((emp) => emp._id !== employeeToDelete),
      );
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(t("errors.deleteFailed"));
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      setIsDeleting(null);
    }
  }, [employeeToDelete, t]);

  // Handle successful employee update
  const handleUpdateSuccess = useCallback(
    (updatedEmployee: Employee) => {
      const mappedEmployee = mapToTableRow(updatedEmployee);
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp._id === mappedEmployee._id ? mappedEmployee : emp,
        ),
      );
      toast.success(t("updateSuccess"));
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
    },
    [t],
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <div className="flex space-x-2">
            <AddEmployeeDialog
              isOpen={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                fetchEmployees();
              }}
            />
            <ImportEmployeesDialog
              isOpen={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
              onSuccess={() => {
                setIsImportDialogOpen(false);
                fetchEmployees();
              }}
            />
          </div>
        </div>

        <div className="rounded-md border">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.headers.name")}</TableHead>
                  <TableHead>{t("table.headers.employeeId")}</TableHead>
                  <TableHead>{t("table.headers.department")}</TableHead>
                  <TableHead>{t("table.headers.position")}</TableHead>
                  <TableHead>{t("table.headers.status")}</TableHead>
                  <TableHead>{t("table.headers.joinDate")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                  ))}
              </TableBody>
            </Table>
          ) : (
            <EmployeeDataTable
              data={employees}
              columns={columns}
              searchKey="name"
            />
          )}
        </div>
      </div>

      {/* Edit Employee Dialog */}
      {selectedEmployee && (
        <EditEmployeeDialog
          employee={selectedEmployee}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            // Refresh the employee list after successful update
            fetchEmployees();
            setIsEditDialogOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description")}
        confirmText={
          isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")
        }
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={!!isDeleting}
      />
    </div>
  );
}
