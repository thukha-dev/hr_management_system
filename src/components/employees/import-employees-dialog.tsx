"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ImportEmployeesDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
  importedCount?: number;
}

export function ImportEmployeesDialog({
  isOpen = false,
  onOpenChange,
  onSuccess,
}: ImportEmployeesDialogProps) {
  const [open, setOpen] = useState(isOpen);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);

    if (!newOpen) {
      // Reset state when dialog is closed
      setFile(null);
      setValidationErrors([]);
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(t("employees.import.invalidFileType"));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error(t("employees.import.fileTooLarge"));
      return false;
    }

    return true;
  };

  const requiredColumns = [
    "employeeId",
    "name",
    "department",
    "position",
    "joinDate",
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      // Read file and check headers
      const reader = new FileReader();
      reader.onload = (event) => {
        let headers: string[] = [];
        try {
          if (selectedFile.name.endsWith(".csv")) {
            const text = event.target?.result as string;
            headers = text
              .split("\n")[0]
              .replace(/\r/g, "")
              .split(",")
              .map((h) => h.trim());
          } else if (
            selectedFile.name.endsWith(".xlsx") ||
            selectedFile.name.endsWith(".xls")
          ) {
            // Use SheetJS to parse Excel headers
            const XLSX = require("xlsx");
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            headers = (jsonData[0] as string[]).map((h) => h.trim());
          }
        } catch (err) {
          toast.error("Failed to read file headers.");
          return;
        }
        const missing = requiredColumns.filter((col) => !headers.includes(col));
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}`);
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setFile(selectedFile);
        setValidationErrors([]);
        setImportResult(null);
      };
      if (selectedFile.name.endsWith(".csv")) {
        reader.readAsText(selectedFile);
      } else {
        reader.readAsArrayBuffer(selectedFile);
      }
    }
  };

  const validateEmployeeData = (
    data: any[],
    headers: string[],
  ): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = [
      "employeeId",
      "name",
      "department",
      "position",
      "joinDate",
    ];
    const validDepartments = [
      "HR",
      "Engineering",
      "Marketing",
      "Sales",
      "Finance",
      "IT",
    ];
    const validPositions = [
      "Manager",
      "Developer",
      "Designer",
      "Analyst",
      "Coordinator",
      "Director",
    ];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === "") {
          errors.push({
            row: rowNumber,
            column: field,
            value: row[field] || "",
            message: `${field} is required`,
          });
        }
      });

      // Validate employeeId format (should be unique)
      if (row.employeeId) {
        if (!/^[A-Z]{2,3}-\d{5}$/.test(row.employeeId)) {
          errors.push({
            row: rowNumber,
            column: "employeeId",
            value: row.employeeId,
            message: "Employee ID must be in format: XX-00000 or XXX-00000",
          });
        }
      }

      // Validate department
      if (row.department && !validDepartments.includes(row.department)) {
        errors.push({
          row: rowNumber,
          column: "department",
          value: row.department,
          message: `Department must be one of: ${validDepartments.join(", ")}`,
        });
      }

      // Validate position
      if (row.position && !validPositions.includes(row.position)) {
        errors.push({
          row: rowNumber,
          column: "position",
          value: row.position,
          message: `Position must be one of: ${validPositions.join(", ")}`,
        });
      }

      // Validate email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({
          row: rowNumber,
          column: "email",
          value: row.email,
          message: "Invalid email format",
        });
      }

      // Validate join date
      if (row.joinDate) {
        const joinDate = new Date(row.joinDate);
        if (isNaN(joinDate.getTime())) {
          errors.push({
            row: rowNumber,
            column: "joinDate",
            value: row.joinDate,
            message: "Invalid date format. Use YYYY-MM-DD",
          });
        }
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t("employees.import.noFileSelected"));
      return;
    }

    setIsUploading(true);
    setValidationErrors([]);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (result.success) {
        setImportResult(result);
        toast.success(
          t("employees.import.importSuccess", {
            count: result.importedCount || 0,
          }),
        );
        onSuccess?.();
      } else {
        setValidationErrors(result.errors || []);
        toast.error(result.message || t("employees.import.importFailed"));
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(t("employees.import.importFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = `employeeId,name,department,position,joinDate,email,phone,address
MOT-00001,John Doe,IT,Developer,2024-01-15,john.doe@example.com,+1234567890,123 Main St
MOT-00002,Jane Smith,HR,Manager,2024-02-01,jane.smith@example.com,+1234567891,456 Oak Ave
MOT-00003,Bob Johnson,Marketing,Designer,2024-03-10,bob.johnson@example.com,+1234567892,789 Pine Rd`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import CSV/XLSX
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("employees.import.title")}</DialogTitle>
          <DialogDescription>
            {t("employees.import.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {t("employees.import.templateHelp")}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleTemplate}
              className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-900/30"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("employees.import.downloadTemplate")}
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">{t("employees.import.selectFile")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {t("employees.import.validationErrors")} (
                  {validationErrors.length})
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    <strong>
                      Row {error.row}, Column "{error.column}":
                    </strong>{" "}
                    {error.message}
                    {error.value && ` (Value: "${error.value}")`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && importResult.success && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {t("employees.import.importSuccess", {
                  count: importResult.importedCount || 0,
                })}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            {t("employees.import.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isUploading || validationErrors.length > 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("employees.import.importing")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("employees.import.importButton")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
