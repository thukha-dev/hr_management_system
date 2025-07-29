"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EmployeeDataTable } from "@/components/employees/employee-data-table";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";
import { deleteEmployee } from "@/app/actions/employee-actions";
import { useEffect, useState } from "react";
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

// Define the Employee type
type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "inactive" | "on_leave";
  joinDate: string;
  profilePhoto?: string;
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const t = useTranslations();

  // Define columns for the data table with proper typing
  const columns: ColumnDef<Employee>[] = [
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
      accessorKey: "employeeId",
      header: "Employee ID",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "position",
      header: "Position",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusMap: Record<string, string> = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-red-100 text-red-800",
          on_leave: "bg-yellow-100 text-yellow-800",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusMap[status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {status.split("_").join(" ").toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
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
                  className="cursor-pointer"
                  disabled={isDeleting === employee.id}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteClick(employee.id);
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  disabled={isDeleting === employee.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Function to fetch employees from the API
  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();

      // Convert MongoDB documents to plain objects and transform the data
      return data.map((emp: any) => {
        // First convert to plain object to handle MongoDB specific types
        const plainEmp = toPlainObject(emp);

        // Then ensure the structure matches our Employee type
        return {
          id: plainEmp._id?.toString() || "",
          employeeId: plainEmp.employeeId || "",
          name: plainEmp.name || "",
          email: plainEmp.contactInfo?.email || "",
          phone: plainEmp.contactInfo?.phone || "",
          address: plainEmp.contactInfo?.address || "",
          department: plainEmp.department || "",
          position: plainEmp.position || "",
          status: plainEmp.status || "active",
          joinDate: plainEmp.joinDate
            ? new Date(plainEmp.joinDate).toISOString()
            : new Date().toISOString(),
          profilePhoto: plainEmp.profilePhoto || "",
          contactInfo: {
            email: plainEmp.contactInfo?.email || "",
            phone: plainEmp.contactInfo?.phone || "",
            address: plainEmp.contactInfo?.address || "",
          },
        };
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
      return [];
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("Error loading employees:", error);
        toast.error("Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleEdit = (employee: Employee) => {
    // Ensure the employee data is a plain object before setting it to state
    const plainEmployee = toPlainObject(employee);
    setSelectedEmployee(plainEmployee);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the employee list after a successful edit
    fetchEmployees().then((data) => setEmployees(data));
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteClick = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(employeeToDelete);
    try {
      const result = await deleteEmployee(employeeToDelete);

      if (result.success) {
        // Update the UI by removing the deleted employee
        setEmployees((prev) =>
          prev.filter((emp) => emp.id !== employeeToDelete),
        );
        toast.success(t("employees.deleteSuccess"));
      } else {
        toast.error(result.message || t("employees.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(t("employees.deleteError"));
    } finally {
      setIsDeleting(null);
      setEmployeeToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
        </div>
      ) : (
        <div className="rounded-md border">
          <EmployeeDataTable
            columns={columns}
            data={employees}
            searchKey="name"
          />
        </div>
      )}

      <AddEmployeeDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          // Refresh the employee list after a successful add
          fetchEmployees().then((data) => setEmployees(data));
        }}
      />

      {selectedEmployee && (
        <EditEmployeeDialog
          employee={selectedEmployee}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            // Refresh the employee list after a successful edit
            fetchEmployees().then((data) => setEmployees(data));
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t("employees.confirmDeleteTitle")}
        description={t("employees.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        isLoading={isDeleting !== null}
      />
    </div>
  );
}
