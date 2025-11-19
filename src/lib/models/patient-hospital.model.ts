import { Schema, model, models } from 'mongoose';

const PatientHospitalSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    mrn: { type: String }, // Medical Record Number specific to this hospital
    lastVisit: { type: Date }
  },
  { timestamps: true }
);

// Compound index to prevent duplicates
PatientHospitalSchema.index({ patientId: 1, hospitalId: 1 }, { unique: true });

export const PatientHospitalModel =
  models.PatientHospital || model('PatientHospital', PatientHospitalSchema);
