import type { RxJsonSchema } from 'rxdb';

export type PatientDocType = {
  _id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  cnic: string;
  cnicIV: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  clerkId?: string;
  userId?: string;
  contact?: {
    primaryNumber?: string;
    secondaryNumber?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phoneNo?: string;
  };
  medicalHistory?: Array<{
    condition: string;
    diagnosedAt?: string;
    status?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
};

export const patientSchema: RxJsonSchema<PatientDocType> = {
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      maxLength: 200
    },
    gender: {
      type: 'string',
      enum: ['male', 'female', 'other']
    },
    dateOfBirth: {
      type: 'string',
      format: 'date-time'
    },
    cnic: {
      type: 'string',
      maxLength: 15
    },
    cnicIV: {
      type: 'string',
      maxLength: 100
    },
    bloodGroup: {
      type: 'string',
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    clerkId: {
      type: 'string'
    },
    userId: {
      type: 'string'
    },
    contact: {
      type: 'object',
      properties: {
        primaryNumber: { type: 'string' },
        secondaryNumber: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' }
      }
    },
    emergencyContact: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        relation: { type: 'string' },
        phoneNo: { type: 'string' }
      }
    },
    medicalHistory: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          condition: { type: 'string' },
          diagnosedAt: { type: 'string' },
          status: { type: 'string' }
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
  required: ['_id', 'name', 'gender', 'dateOfBirth', 'cnic', 'cnicIV', 'createdAt', 'updatedAt', 'syncStatus'],
  indexes: ['cnic', 'name', 'updatedAt']
};
