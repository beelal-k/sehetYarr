import type { RxJsonSchema } from 'rxdb';

export type HospitalDocType = {
  _id: string;
  name: string;
  userId: string;
  location?: {
    area?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  contact?: {
    primaryNumber?: string;
    secondaryNumber?: string;
  };
  type: 'hospital' | 'clinic' | 'dispensary' | 'ngo' | 'other';
  ownershipType: 'public' | 'private' | 'semi-government' | 'ngo';
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
};

export const hospitalSchema: RxJsonSchema<HospitalDocType> = {
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
    location: {
      type: 'object',
      properties: {
        area: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' }
      }
    },
    contact: {
      type: 'object',
      properties: {
        primaryNumber: { type: 'string' },
        secondaryNumber: { type: 'string' }
      }
    },
    type: {
      type: 'string',
      enum: ['hospital', 'clinic', 'dispensary', 'ngo', 'other'],
      maxLength: 20
    },
    ownershipType: {
      type: 'string',
      enum: ['public', 'private', 'semi-government', 'ngo']
    },
    registrationNumber: {
      type: 'string'
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
  required: ['_id', 'name', 'userId', 'type', 'ownershipType', 'registrationNumber', 'createdAt', 'updatedAt', 'syncStatus'],
  indexes: ['name', 'type', 'updatedAt']
};
