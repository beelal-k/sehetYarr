export interface Hospital {
  _id: string;
  name: string;
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
}

export interface HospitalListResponse {
  hospitals: Hospital[];
  total: number;
  page: number;
  limit: number;
}
