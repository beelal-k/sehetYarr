export interface Appointment {
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
  appointmentDate: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  priority?: 'Normal' | 'Urgent';
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}
