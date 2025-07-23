import {
  prop as Property,
  getModelForClass,
  modelOptions,
  DocumentType,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import * as bcrypt from "bcryptjs";
import { Document, Schema } from "mongoose";

export type UserDocument = DocumentType<User> & Document;

export enum UserRole {
  Employee = "Employee",
  Account = "Account",
  Admin = "Admin",
  DepartmentHead = "Department Head",
  SeniorAdmin = "Senior Admin",
  SuperAdmin = "Super Admin",
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class User extends TimeStamps {
  @Property({
    type: () => String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email"],
  })
  public email!: string;

  @Property({
    type: () => String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  })
  public name!: string;

  @Property({
    type: () => String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  })
  public password!: string;

  @Property({
    type: () => String,
    enum: Object.values(UserRole),
    default: UserRole.Employee,
    required: [true, "User role is required"],
  })
  public role!: UserRole;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
}

export const UserModel = getModelForClass(User);

// Add pre-save hook for password hashing
UserModel.schema.pre("save", async function (this: UserDocument, next) {
  if (this.isModified("password")) {
    await this.hashPassword();
  }
  next();
});
