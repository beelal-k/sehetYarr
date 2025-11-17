export interface Patient {
  _id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  cnic: string;
  cnicIV: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
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
    condition?: string;
    diagnosedAt?: string;
    status?: 'active' | 'recovered' | 'chronic';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
}
