export interface Doctor {
  _id: string;
  name: string;
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
  hospitalIds?: Array<{
    _id: string;
    name: string;
  }>;
  availability?: {
    days?: string[];
    timeSlots?: Array<{
      start?: string;
      end?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DoctorListResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
}
