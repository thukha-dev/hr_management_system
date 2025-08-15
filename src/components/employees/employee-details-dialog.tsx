import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeTableRow, BankProvider } from "@/types/interface";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  CreditCard,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Briefcase,
  Edit,
  X,
  Home,
  Calendar,
} from "lucide-react";

const getStatusBadgeVariant = (status: string) => {
  if (!status) return "outline";
  switch (status.toLowerCase()) {
    case "active":
      return "default";
    case "on leave":
      return "secondary";
    case "inactive":
      return "destructive";
    default:
      return "outline";
  }
};

const formatBankProvider = (provider?: BankProvider) => {
  if (!provider) return "Not specified";
  return provider
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

type EmployeeDetailsDialogProps = {
  employee: EmployeeTableRow | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EmployeeDetailsDialog({
  employee,
  isOpen,
  onOpenChange,
}: EmployeeDetailsDialogProps) {
  if (!employee) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between border-b p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-primary" />
            <DialogTitle className="text-sm font-semibold">
              Employee Profile
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 p-0 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="p-2 sm:p-3 space-y-2">
          {/* Profile Section - Full Width */}
          <div className="w-full">
            <Card className="overflow-hidden border shadow-sm">
              <div className="flex flex-col items-center py-2">
                <div className="relative group mb-2 sm:mb-3">
                  <div className="absolute inset-0 bg-primary/5 rounded-full scale-90 group-hover:scale-95 transition-transform duration-200" />
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background relative">
                    <AvatarImage
                      src={employee.avatar || ""}
                      alt={employee.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-base font-semibold text-center mt-1">
                  {employee.name}
                </h3>
                <p className="text-[11px] text-muted-foreground text-center mb-1">
                  {employee.position || "No position specified"}
                </p>
                <Badge
                  variant={getStatusBadgeVariant(employee.status || "")}
                  className="text-xs sm:text-sm px-2 py-0.5 rounded-full bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40"
                >
                  {employee.status || "No status"}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Grid Layout for Other Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card className="border shadow-sm">
              <CardHeader className="p-2.5 sm:p-3 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center text-muted-foreground">
                  <Mail className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 pt-0">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Phone
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.phone || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Address
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.address || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card className="border shadow-sm">
              <CardHeader className="p-2.5 sm:p-3 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center text-muted-foreground">
                  <Briefcase className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Job Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 pt-0">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Department
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.department || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Position
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.position || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Hire Date
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.hireDate
                        ? format(new Date(employee.hireDate), "PP")
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card className="border shadow-sm">
              <CardHeader className="p-2.5 sm:p-3 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center text-muted-foreground">
                  <FileText className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Contract Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 pt-0">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Contract Type
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.contractType || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Contract Start
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.contractStart
                        ? format(new Date(employee.contractStart), "PP")
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Contract End
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.contractEnd
                        ? format(new Date(employee.contractEnd), "PP")
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card className="border shadow-sm">
              <CardHeader className="p-2.5 sm:p-3 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center text-muted-foreground">
                  <CreditCard className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Bank Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 pt-0">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Bank Name
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.bankName
                        ? formatBankProvider(employee.bankName)
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Account Number
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.bankAccountNumber || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      Account Name
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {employee.bankAccountName || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Information */}
          {employee.salary && (
            <Card className="border shadow-sm">
              <CardHeader className="p-2.5 sm:p-3 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center text-muted-foreground">
                  <DollarSign className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Salary Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 pt-0">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center">
                      <Banknote className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span>Basic Salary</span>
                    </p>
                    <p className="text-xs sm:text-sm text-foreground mt-1">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(employee.salary)}
                    </p>
                  </div>
                  {employee.salaryProbation && (
                    <div className="space-y-1">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center">
                        <Banknote className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span>Probation Salary</span>
                      </p>
                      <p className="text-xs sm:text-sm text-foreground mt-1">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(employee.salaryProbation)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
