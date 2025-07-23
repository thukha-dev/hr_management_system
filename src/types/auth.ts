export interface FormState {
  success?: boolean;
  message: string;
  errors: {
    employeeId?: string[];
    password?: string[];
    _form?: string[];
  };
  values: {
    employeeId: string;
    password: string;
    remember: boolean;
  };
}

export const initialFormState: FormState = {
  message: "",
  errors: {},
  values: {
    employeeId: "",
    password: "",
    remember: false,
  },
};

export enum UserRole {
  Employee = "Employee",
  Account = "Account",
  Admin = "Admin",
  DepartmentHead = "Department Head",
  SeniorAdmin = "Senior Admin",
  SuperAdmin = "Super Admin",
}

export type UserRoleType = `${UserRole}`;
