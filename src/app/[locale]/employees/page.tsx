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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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
                  onClick={() => handleDelete(employee.id)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  disabled={isDeleting === employee.id}
                >
                  {isDeleting === employee.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.deleting")}
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("common.delete")}
                    </>
                  )}
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

      // Transform the data to match our Employee type
      return data.map((emp: any) => ({
        id: emp._id?.toString() || "",
        employeeId: emp.employeeId || "",
        name: emp.name || "",
        contactInfo: emp.contactInfo || {},
        department: emp.department || "",
        position: emp.position || "",
        status: emp.status || "active",
        joinDate: emp.joinDate
          ? new Date(emp.joinDate).toLocaleDateString()
          : "",
        profilePhoto: emp.profilePhoto,
      }));
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
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("Error loading employees:", error);
        toast.error("Failed to load employees");
      }
    };

    loadEmployees();
  }, []);

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the employee list after a successful edit
    fetchEmployees().then((data) => setEmployees(data));
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("employees.confirmDelete"))) return;

    setIsDeleting(id);
    try {
      const result = await deleteEmployee(id);

      if (result.success) {
        // Update the UI by removing the deleted employee
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
        toast.success(t("employees.deleteSuccess"));
      } else {
        toast.error(result.message || t("employees.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(t("employees.deleteError"));
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        {/* <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button> */}
      </div>

      <div className="rounded-md border">
        <EmployeeDataTable
          columns={columns}
          data={employees}
          searchKey="name"
        />
      </div>

      <AddEmployeeDialog
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
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
