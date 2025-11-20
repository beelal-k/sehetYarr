import type { RxJsonSchema } from 'rxdb';

export type MedicalRecordDocType = {
  _id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  visitDate?: string;
  diagnosis?: string;
  symptoms?: string[];
  prescriptions?: Array<{
    medicineName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    notes?: string;
  }>;
  testsOrdered?: Array<{
    testName: string;
    results?: string;
    testDate?: string;
  }>;
  allergies?: string[];
  treatmentPlan?: string;
  followUpDate?: string;
  notes?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileId?: string; // Reference to local file in attachments collection
  }>;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
};

export const medicalRecordSchema: RxJsonSchema<MedicalRecordDocType> = {
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      maxLength: 100
    },
    patientId: {
      type: 'string',
      maxLength: 100
    },
    doctorId: {
      type: 'string',
      maxLength: 100
    },
    hospitalId: {
      type: 'string',
      maxLength: 100
    },
    visitDate: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    diagnosis: {
      type: 'string'
    },
    symptoms: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    prescriptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          medicineName: { type: 'string' },
          dosage: { type: 'string' },
          frequency: { type: 'string' },
          duration: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    },
    testsOrdered: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          testName: { type: 'string' },
          results: { type: 'string' },
          testDate: { type: 'string' }
        }
      }
    },
    allergies: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    treatmentPlan: {
      type: 'string'
    },
    followUpDate: {
      type: 'string',
      format: 'date-time'
    },
    notes: {
      type: 'string'
    },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fileName: { type: 'string' },
          fileUrl: { type: 'string' },
          fileType: { type: 'string' },
          fileId: { type: 'string' }
        }
      }
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    syncStatus: {
      type: 'string',
      enum: ['synced', 'pending', 'failed']
    }
  },
  required: ['_id', 'patientId', 'doctorId', 'hospitalId', 'createdAt', 'updatedAt', 'syncStatus'],
  indexes: ['patientId', 'doctorId', 'hospitalId', 'updatedAt']
};
