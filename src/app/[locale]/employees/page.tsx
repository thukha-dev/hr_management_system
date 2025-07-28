"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EmployeeDataTable } from "@/components/employees/employee-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

// Define the Employee type
type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "inactive" | "on_leave";
  joinDate: string;
};

// Sample data
const data: Employee[] = [
  {
    id: "EMP-001",
    name: "John Doe",
    email: "john.doe@example.com",
    department: "Engineering",
    position: "Senior Developer",
    status: "active",
    joinDate: "2022-01-15",
  },
  {
    id: "EMP-002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    department: "HR",
    position: "HR Manager",
    status: "active",
    joinDate: "2021-11-03",
  },
  {
    id: "EMP-003",
    name: "Robert Johnson",
    email: "robert.j@example.com",
    department: "Marketing",
    position: "Marketing Director",
    status: "on_leave",
    joinDate: "2021-08-22",
  },
  {
    id: "EMP-004",
    name: "Emily Davis",
    email: "emily.d@example.com",
    department: "Engineering",
    position: "Frontend Developer",
    status: "active",
    joinDate: "2023-02-10",
  },
  {
    id: "EMP-005",
    name: "Michael Brown",
    email: "michael.b@example.com",
    department: "Finance",
    position: "Financial Analyst",
    status: "inactive",
    joinDate: "2020-05-18",
  },
];

// Define columns
const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "id",
    header: "Employee ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
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
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : status === "on_leave"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "joinDate",
    header: "Join Date",
  },
];

export default function EmployeesPage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Employee Management
          </h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your employee records and information
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <EmployeeDataTable columns={columns} data={data} searchKey="name" />
      </div>
    </div>
  );
}
