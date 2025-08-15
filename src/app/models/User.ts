import { DocumentType } from "@typegoose/typegoose";
import mongoose, { Schema, Document } from "mongoose";
import { UserRoleType } from "@/types/auth";

export interface ContactInfo {
  phone?: string;
  parentContactPhone?: string;
  email?: string; // Email P
  currentAddress?: string; // Current Address
  permanentAddress?: string; // Permanent Address
  [key: string]: any;
}

export interface IUser {
  employeeId: string;
  name: string;
  nrc: string; // NRC number
  joinDate: Date; // Join Date
  department: string;
  position: string;
  contactInfo: ContactInfo;
  profilePhoto: string;
  role: UserRoleType;
  workLocation: "OFFICE" | "WFH"; // WFH/Office
  password: string;
  joinMonth: string; // Join Month
  materialStatus: "Single" | "Married";
  salaryProbation: number; // Salary (Probation)
  salary: number; // Salary (After Probation)
  birthMonth: string; // Birth Month
  realBirthDate: Date; // Real Birth Date
  nrcBirthDate: Date; // NRC Birth Date
  bankProvider: string; // Bank Account
  bankAccountNumber: string; // Account Number
  contractDate: Date; // Contract Date
  contractByName: string; // Contract By	Name of person
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = DocumentType<IUser> & Document;

const UserSchema: Schema = new Schema<IUser>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nrc: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\d{1,2}\/[A-Za-z]{1,3}\([A-Za-z]\)\d{6}$/,
        "Please provide a valid NRC format (e.g., 12/ABC(N)123456)",
      ],
    },
    joinDate: { type: Date, required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    contactInfo: {
      phone: { type: String },
      parentContactPhone: { type: String },
      email: { type: String },
      currentAddress: { type: String },
      permanentAddress: { type: String },
      // Allow additional fields
    },
    profilePhoto: { type: String, default: "" },
    role: {
      type: String,
      enum: [
        "Employee",
        "Account",
        "Admin",
        "Department Head",
        "Senior Admin",
        "Super Admin",
        "HR",
      ],
      default: "Employee",
      required: true,
    },
    workLocation: {
      type: String,
      enum: ["OFFICE", "WFH"],
      default: "OFFICE",
      required: true,
    },
    password: { type: String, required: true, select: false },
    joinMonth: { type: String, required: true },
    materialStatus: {
      type: String,
      enum: ["Single", "Married"],
      required: true,
    },
    salaryProbation: { type: Number, required: true },
    salary: { type: Number, required: true },
    birthMonth: { type: String, required: true },
    realBirthDate: { type: Date, required: true },
    nrcBirthDate: { type: Date, required: true },
    bankProvider: { type: String, required: true },
    bankAccountNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^[0-9]+$/.test(v);
        },
        message: (props: any) =>
          `${props.value} is not a valid bank account number!`,
      },
    },
    contractDate: { type: Date, required: true },
    contractByName: { type: String, required: true },
  },
  { timestamps: true },
);

const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default UserModel;
