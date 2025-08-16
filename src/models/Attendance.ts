import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut?: Date;
  location: string;
  latitude?: number;
  longitude?: number;
  duration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Add index for querying open check-ins
attendanceSchema.index(
  { userId: 1, checkOut: 1 },
  { unique: true, partialFilterExpression: { checkOut: null } },
);

// Add index for date-based queries
attendanceSchema.index({ userId: 1, checkIn: -1 });

const Attendance =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
