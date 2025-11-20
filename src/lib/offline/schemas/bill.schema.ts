import type { RxJsonSchema } from 'rxdb';

export type BillDocType = {
  _id: string;
  patientId: string;
  hospitalId: string;
  doctorId?: string;
  medicalRecordId?: string;
  billDate: string;
  totalAmount: number;
  paidAmount: number;
  status: 'Pending' | 'Paid' | 'Partial' | 'Cancelled';
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Insurance';
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  discount?: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
};

export const billSchema: RxJsonSchema<BillDocType> = {
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
    hospitalId: {
      type: 'string',
      maxLength: 100
    },
    doctorId: {
      type: 'string'
    },
    medicalRecordId: {
      type: 'string'
    },
    billDate: {
      type: 'string',
      format: 'date-time'
    },
    totalAmount: {
      type: 'number'
    },
    paidAmount: {
      type: 'number'
    },
    status: {
      type: 'string',
      enum: ['Pending', 'Paid', 'Partial', 'Cancelled'],
      maxLength: 20
    },
    paymentMethod: {
      type: 'string',
      enum: ['Cash', 'Card', 'Bank Transfer', 'Insurance']
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          amount: { type: 'number' }
        }
      }
    },
    discount: {
      type: 'number'
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
  required: ['_id', 'patientId', 'hospitalId', 'billDate', 'totalAmount', 'paidAmount', 'status', 'paymentMethod', 'createdAt', 'updatedAt', 'syncStatus'],
  indexes: ['patientId', 'hospitalId', 'status', 'updatedAt']
};
