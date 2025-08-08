import {
  prop as Property,
  getModelForClass,
  modelOptions,
  DocumentType,
  Ref,
} from "@typegoose/typegoose";
import mongoose, { Schema, Document, Types } from "mongoose";
import { UserDocument } from "./User";

export type LeaveDocument = DocumentType<ILeave> & Document;

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum LeaveType {
  ANNUAL = "annual",
  SICK = "sick",
  UNPAID = "unpaid",
  HALF_UNPAID = "half-unpaid",
  MATERNITY = "maternity",
  PATERNITY = "paternity",
}

export enum HalfDayTime {
  MORNING = "morning",
  EVENING = "evening",
}

export interface ILeave extends Document {
  employee: Ref<UserDocument>;
  leaveType: LeaveType;
  leaveDate: Date;
  halfDayTime?: HalfDayTime;
  reason: string;
  status: LeaveStatus;
  approvedBy?: Ref<UserDocument>;
  approvedAt?: Date;
  comment?: string;
  days: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema<ILeave>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: true,
    },
    leaveDate: {
      type: Date,
      required: true,
    },
    halfDayTime: {
      type: String,
      enum: Object.values(HalfDayTime),
      required: function (this: ILeave) {
        return (
          this.leaveType === LeaveType.HALF_UNPAID ||
          this.leaveType === LeaveType.UNPAID
        );
      },
    },
    reason: {
      type: String,
      required: true,
      minlength: [10, "Reason must be at least 10 characters long"],
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    comment: {
      type: String,
    },
    days: {
      type: Number,
      required: true,
      min: [0.5, "Leave duration must be at least 0.5 days"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for faster queries
LeaveSchema.index({ employee: 1, status: 1 });
LeaveSchema.index({ leaveDate: 1 });

// Virtual for leave duration in days
LeaveSchema.virtual("duration").get(function (this: ILeave) {
  return this.leaveType === LeaveType.HALF_UNPAID ||
    this.leaveType === LeaveType.UNPAID
    ? 0.5
    : 1;
});

// Pre-save hook to calculate days
LeaveSchema.pre<ILeave>("save", function (next) {
  this.days =
    this.leaveType === LeaveType.HALF_UNPAID ||
    this.leaveType === LeaveType.UNPAID
      ? 0.5
      : 1;
  next();
});

const LeaveModel =
  mongoose.models.Leave || mongoose.model<ILeave>("Leave", LeaveSchema);

export default LeaveModel;
