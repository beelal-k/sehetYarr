import { Schema, model, models } from 'mongoose';
import { HospitalType, OwnershipType } from '../enums';

const HospitalLocationSchema = new Schema(
  {
    address: String,
    city: String,
    state: String
  },
  { _id: false }
);

const DepartmentServiceSchema = new Schema(
  {
    generalOPD: String,
    immunization: String,
    TBControl: String,
    minorProcedures: String,
    basicEmergency: String,
    LHV_Services: String,
    deliveryRoom: String,
    basicLabTests: String,
    malariaSmear: String
  },
  { _id: false }
);

const DepartmentsSchema = new Schema(
  {
    'medicine&applied': DepartmentServiceSchema,
    'surgery&allied': DepartmentServiceSchema,
    'accident&emergency': DepartmentServiceSchema,
    'pathalogy&laboratory': DepartmentServiceSchema
  },
  { _id: false }
);

const HospitalSchema = new Schema(
  {
    hospitalName: { type: String, required: true },
    hospitalAddress: String,
    hospitalLocation: HospitalLocationSchema,
    doctorId: String,
    type: { type: String, required: true, enum: Object.values(OwnershipType) },
    hospitalServices: [String],
    numberOfBeds: String,
    departments: DepartmentsSchema,
    ntnNumber: { type: String, required: true }
  },
  { timestamps: true }
);

export const HospitalModel =
  models.Hospital || model('Hospital', HospitalSchema);
