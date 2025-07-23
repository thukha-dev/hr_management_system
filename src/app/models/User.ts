import {
  prop as Property,
  getModelForClass,
  modelOptions,
  DocumentType,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import mongoose, { Schema, Document } from "mongoose";
import { UserRole, UserRoleType } from "@/types/auth";

export type UserDocument = DocumentType<IUser> & Document;

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  [key: string]: any;
}

export interface IUser extends Document {
  employeeId: string;
  name: string;
  joinDate: Date;
  department: string;
  position: string;
  contactInfo: ContactInfo;
  profilePhoto: string;
  role: UserRoleType;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
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
    password: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default UserModel;
