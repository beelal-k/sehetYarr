import type { RxJsonSchema } from 'rxdb';

export type AppointmentDocType = {
  _id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  appointmentDate: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  reason?: string;
  priority?: 'Normal' | 'Urgent';
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
};

export const appointmentSchema: RxJsonSchema<AppointmentDocType> = {
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
    appointmentDate: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    status: {
      type: 'string',
      enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
      maxLength: 20
    },
    reason: {
      type: 'string'
    },
    priority: {
      type: 'string',
      enum: ['Normal', 'Urgent']
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
  required: ['_id', 'patientId', 'doctorId', 'hospitalId', 'appointmentDate', 'status', 'createdAt', 'updatedAt', 'syncStatus'],
  indexes: ['patientId', 'doctorId', 'hospitalId', 'appointmentDate', 'status', 'updatedAt']
};
