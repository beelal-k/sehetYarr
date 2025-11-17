export interface MedicalRecord {
  _id: string;
  patientId: {
    _id: string;
    name: string;
  };
  doctorId: {
    _id: string;
    name: string;
  };
  hospitalId: {
    _id: string;
    name: string;
  };
  visitDate?: string;
  diagnosis?: string;
  symptoms?: string[];
  prescriptions?: Array<{
    medicineName?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    notes?: string;
  }>;
  testsOrdered?: Array<{
    testName?: string;
    results?: string;
    testDate?: string;
  }>;
  allergies?: string[];
  treatmentPlan?: string;
  followUpDate?: string;
  notes?: string;
  attachments?: Array<{
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordListResponse {
  medicalRecords: MedicalRecord[];
  total: number;
  page: number;
  limit: number;
}
