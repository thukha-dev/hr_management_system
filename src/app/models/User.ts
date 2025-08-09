import { DocumentType } from "@typegoose/typegoose";
import mongoose, { Schema, Document } from "mongoose";
import { UserRoleType } from "@/types/auth";

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  [key: string]: any;
}

export interface IUser {
  employeeId: string;
  name: string;
  nrc: string;
  joinDate: Date;
  department: string;
  position: string;
  contactInfo: ContactInfo;
  profilePhoto: string;
  role: UserRoleType;
  workLocation: "OFFICE" | "WFH";
  password: string;
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
        /^[0-9]\/[A-Za-z]+?\([A-Za-z]\)[0-9]{6}$/,
        "Please provide a valid NRC format (e.g., 12/ABC(N)123456)",
      ],
    },
    joinDate: { type: Date, required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    contactInfo: {
      phone: { type: String },
      email: { type: String },
      address: { type: String },
      // Allow additional fields
    },
    profilePhoto: { type: String },
    role: { type: String, default: "Employee", required: true },
    workLocation: {
      type: String,
      enum: ["OFFICE", "WFH"],
      default: "OFFICE",
      required: true,
    },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default UserModel;
