import "reflect-metadata";
import {
  prop as Property,
  getModelForClass,
  modelOptions,
  DocumentType,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import * as bcrypt from "bcryptjs";
import { Document } from "mongoose";

type UserDocument = DocumentType<User> & Document;

export enum UserRole {
  Employee = "Employee",
  Account = "Account",
  Admin = "Admin",
  DepartmentHead = "Department Head",
  SeniorAdmin = "Senior Admin",
  SuperAdmin = "Super Admin",
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class User extends TimeStamps {
  @Property({ required: true })
  public email!: string;

  @Property({ required: true })
  public name!: string;

  @Property({ required: true, select: false })
  public password!: string;

  @Property({
    enum: UserRole,
    default: UserRole.Employee,
    type: String,
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
