import type { RxJsonSchema } from 'rxdb';

export type DoctorDocType = {
  _id: string;
  name: string;
  userId: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  cnic: string;
  cnicIV: string;
  specialization?: string;
  experienceYears?: number;
  subSpecialization?: string[];
  qualifications?: string[];
  licenseNumber: string;
  contact?: {
    area?: string;
    city?: string;
    state?: string;
    primaryNumber?: string;
    secondaryNumber?: string;
  };
  hospitalIds?: string[];
  availability?: {
    days?: string[];
    timeSlots?: Array<{
      start: string;
      end: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
};

export const doctorSchema: RxJsonSchema<DoctorDocType> = {
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
    userId: {
      type: 'string',
      maxLength: 100
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
    specialization: {
      type: 'string',
      maxLength: 200
    },
    experienceYears: {
      type: 'number'
    },
    subSpecialization: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    qualifications: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    licenseNumber: {
      type: 'string'
    },
    contact: {
      type: 'object',
      properties: {
        area: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        primaryNumber: { type: 'string' },
        secondaryNumber: { type: 'string' }
      }
    },
    hospitalIds: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    availability: {
      type: 'object',
      properties: {
        days: {
          type: 'array',
          items: { type: 'string' }
        },
        timeSlots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' }
            }
          }
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
  required: ['_id', 'name', 'userId', 'cnic', 'cnicIV', 'licenseNumber', 'createdAt', 'updatedAt', 'syncStatus'],
  indexes: ['cnic', 'name', 'updatedAt']
};
