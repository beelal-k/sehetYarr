import { Schema, model, models } from 'mongoose';

// Define enum directly in the model file to avoid import issues
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  WORKER = 'worker',
  PATIENT = 'patient'
}

const ProfileSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    fullName: String,
    imageUrl: String,
    phoneNumber: String,
    birthday: String,
    gender: String
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    country: String,
    city: String,
    state: String,
    timezone: String
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'worker', 'patient'],
      default: UserRole.PATIENT
    },
    name: String,
    profile: ProfileSchema,
    location: LocationSchema,
    lastSignInAt: Date,
    emailVerified: Boolean,
    phoneVerified: Boolean,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const UserModel = models.User || model('User', UserSchema);
