export enum MaterialStatus {
  Single = "Single",
  Married = "Married",
}

export enum WorkLocation {
  Office = "Office",
  WFH = "WFH",
}

export enum Status {
  Active = "Active",
  Inactive = "Inactive",
  OnLeave = "On Leave",
}

export enum UserRole {
  Employee = "Employee",
  Account = "Account",
  Admin = "Admin",
  DepartmentHead = "Department Head",
  SeniorAdmin = "Senior Admin",
  SuperAdmin = "Super Admin",
}

export enum BankProvider {
  AYA = "AYA",
  CB = "CB",
  KBZ = "KBZ",
  Yoma = "Yoma",
}

export interface EmployeeTableRow {
  _id: string;
  // id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactInfo: {
    email: string;
    phone: string;
    parentContactPhone: string;
    currentAddress: string;
    permanentAddress: string;
  };
  department: string;
  position: string;
  joinDate: string;
  status?: string;
  [key: string]: any; // For any additional properties
}

export interface EmployeeResponse {
  // Identifiers
  _id: string;
  employeeId: string;
  // Personal info
  name: string;
  nrc: string;
  materialStatus: MaterialStatus;
  birthMonth: string;
  realBirthDate: string;
  nrcBirthDate: string;
  // Contact info
  contactInfo?: {
    email?: string;
    phone?: string;
    parentContactPhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
  };
  // Job info
  department: string;
  position: string;
  role: UserRole;
  status?: string;
  workLocation: WorkLocation;
  // Finance
  joinDate: string;
  joinMonth: string;
  salaryProbation: number;
  salary: number;
  // Contract
  contractDate: string;
  contractByName: string;
  bankProvider: string;
  bankAccountNumber: string;
  // Metadata
  profilePhoto: string;
  createdAt?: string;
  updatedAt?: string;
}
